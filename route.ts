import { NextResponse } from 'next/server';

type Participant = {
  name?: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
};

type ConsentPayload = {
  fileName?: string;
  pdfBase64?: string;
  participant?: Participant;
  acceptedAt?: string;
};

const recipientEmail = 'ascom@ictdf.org.br';

function getEnv(name: string) {
  return (process.env as Record<string, string | undefined>)[name];
}

function isPayloadValid(payload: ConsentPayload) {
  return Boolean(
    payload.fileName &&
      payload.pdfBase64 &&
      payload.participant?.name &&
      payload.participant?.cpf &&
      payload.participant?.birthDate &&
      payload.participant?.email &&
      payload.participant?.phone,
  );
}

function escapeHtml(value: string | undefined) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  let payload: ConsentPayload;

  try {
    payload = (await request.json()) as ConsentPayload;
  } catch {
    return NextResponse.json(
      { message: 'Nao foi possivel ler os dados enviados.' },
      { status: 400 },
    );
  }

  if (!isPayloadValid(payload)) {
    return NextResponse.json(
      { message: 'Dados incompletos para envio do termo.' },
      { status: 400 },
    );
  }

  const resendApiKey = getEnv('RESEND_API_KEY');
  const emailFrom = getEnv('EMAIL_FROM');

  if (!resendApiKey || !emailFrom) {
    return NextResponse.json(
      {
        sent: false,
        message:
          'PDF gerado. Para ativar o envio automatico, configure RESEND_API_KEY e EMAIL_FROM no servidor.',
      },
      { status: 200 },
    );
  }

  const participant = payload.participant ?? {};
  const safeParticipant = {
    name: escapeHtml(participant.name),
    cpf: escapeHtml(participant.cpf),
    birthDate: escapeHtml(participant.birthDate),
    email: escapeHtml(participant.email),
    phone: escapeHtml(participant.phone),
  };
  const acceptedAt = payload.acceptedAt
    ? new Date(payload.acceptedAt).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [recipientEmail],
      subject: `Termo de uso de imagem - ${participant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h2 style="color: #173B75;">Termo de uso de imagem assinado</h2>
          <p>Segue em anexo o termo de autorizacao de uso de imagem gerado pela plataforma ICTDF.</p>
          <ul>
            <li><strong>Nome:</strong> ${safeParticipant.name}</li>
            <li><strong>CPF:</strong> ${safeParticipant.cpf}</li>
            <li><strong>Data de nascimento:</strong> ${safeParticipant.birthDate}</li>
            <li><strong>E-mail:</strong> ${safeParticipant.email}</li>
            <li><strong>Telefone:</strong> ${safeParticipant.phone}</li>
            <li><strong>Aceite registrado em:</strong> ${acceptedAt}</li>
          </ul>
        </div>
      `,
      attachments: [
        {
          filename: payload.fileName,
          content: payload.pdfBase64,
        },
      ],
    }),
  });

  if (!resendResponse.ok) {
    return NextResponse.json(
      {
        sent: false,
        message:
          'PDF gerado, mas o servidor de e-mail recusou o envio. O arquivo foi baixado para envio manual.',
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ sent: true });
}
