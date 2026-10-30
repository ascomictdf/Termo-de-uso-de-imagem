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

// Com RESEND_API_KEY, usa o SMTP do Resend. Sem domínio verificado, o Resend
// envia pelo remetente onboarding@resend.dev e apenas para o e-mail da conta
// Resend, por isso a conta deve ser criada com o endereço destinatário.
// Caso contrário, usa um servidor SMTP qualquer (SMTP_HOST, SMTP_USER, SMTP_PASS).
function getSmtpConfig() {
  const resendApiKey = getEnv('RESEND_API_KEY');
  if (resendApiKey) {
    return {
      host: 'smtp.resend.com',
      port: 465,
      user: 'resend',
      pass: resendApiKey,
      defaultFrom: 'Termos ICTDF <onboarding@resend.dev>',
    };
  }

  const host = getEnv('SMTP_HOST');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  if (!host || !user || !pass) return null;

  return { host, port: Number(getEnv('SMTP_PORT') ?? '465'), user, pass, defaultFrom: user };
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

  const smtp = getSmtpConfig();
  if (!smtp) {
    console.error(
      'Envio de e-mail não configurado: defina RESEND_API_KEY ou SMTP_HOST, SMTP_USER e SMTP_PASS.',
    );
    return json({ sent: false, message: 'O envio de e-mail ainda não está configurado no servidor.' }, 500);
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  try {
    await transporter.sendMail({
      from: getEnv('EMAIL_FROM') ?? smtp.defaultFrom,
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
