import nodemailer from 'nodemailer';

// Função serverless da Vercel: recebe o PDF assinado gerado no navegador e
// o envia por e-mail (SMTP) para a ASCOM do ICTDF.

type ConsentPayload = {
  name?: unknown;
  fileName?: unknown;
  pdfBase64?: unknown;
};

const defaultRecipient = 'ascom@ictdf.org.br';
// Limite da Vercel para o corpo da requisição é 4,5 MB; o PDF fica bem abaixo.
const maxPdfBytes = 4 * 1024 * 1024;

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function getEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  let payload: ConsentPayload;
  try {
    payload = (await request.json()) as ConsentPayload;
  } catch {
    return json({ sent: false, message: 'Não foi possível ler os dados enviados.' }, 400);
  }

  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 150) : '';
  const fileName =
    typeof payload.fileName === 'string' && /^[\w.-]{1,150}\.pdf$/.test(payload.fileName)
      ? payload.fileName
      : 'termo-cessao-uso-imagem-nome-voz-ictdf.pdf';
  const pdf =
    typeof payload.pdfBase64 === 'string' ? Buffer.from(payload.pdfBase64, 'base64') : null;

  if (!name || !pdf || pdf.length === 0 || pdf.length > maxPdfBytes) {
    return json({ sent: false, message: 'Dados incompletos para envio do termo.' }, 400);
  }
  if (pdf.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return json({ sent: false, message: 'O arquivo enviado não é um PDF válido.' }, 400);
  }

  const host = getEnv('SMTP_HOST');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  if (!host || !user || !pass) {
    console.error('Envio de e-mail não configurado: defina SMTP_HOST, SMTP_USER e SMTP_PASS.');
    return json({ sent: false, message: 'O envio de e-mail ainda não está configurado no servidor.' }, 500);
  }

  const port = Number(getEnv('SMTP_PORT') ?? '465');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: getEnv('EMAIL_FROM') ?? user,
      to: getEnv('EMAIL_TO') ?? defaultRecipient,
      subject: `Termo de cessão de uso de imagem, nome e voz assinado - ${name}`,
      text: `Nome completo: ${name}\n\nSegue em anexo o termo de cessão de uso de imagem, nome e voz assinado por ${name}.`,
      attachments: [{ filename: fileName, content: pdf, contentType: 'application/pdf' }],
    });
  } catch (error) {
    console.error('Falha ao enviar o termo por e-mail:', error);
    return json({ sent: false, message: 'O servidor de e-mail recusou o envio.' }, 502);
  }

  return json({ sent: true });
}
