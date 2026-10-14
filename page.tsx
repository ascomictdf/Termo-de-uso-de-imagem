'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  CheckCircle2,
  Download,
  Eraser,
  FileSignature,
  Mail,
  PenLine,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormData = {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
};

type SubmitState = 'idle' | 'sending' | 'sent' | 'downloaded' | 'error';

const recipientEmail = 'ascom@ictdf.org.br';
// Na primeira submissão o FormSubmit envia um e-mail de ativação para o
// destinatário; depois de confirmado, os termos passam a chegar normalmente.
const formSubmitEndpoint = `https://formsubmit.co/${recipientEmail}`;

const termTitle = 'TERMO DE CESSÃO DE USO DE IMAGEM, VOZ E NOME';

const termIntro = [
  'Pelo presente instrumento, a pessoa identificada abaixo, doravante denominada CEDENTE, cede ao Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF, doravante denominado CESSIONÁRIO, o direito de uso de sua imagem, voz e nome, nos termos do art. 5º, incisos V e X, da Constituição Federal, do art. 20 do Código Civil (Lei nº 10.406/2002) e da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), mediante as cláusulas e condições a seguir.',
];

const termClauses = [
  {
    title: 'Cláusula 1ª - Do objeto',
    body: [
      'O CEDENTE autoriza o ICTDF a utilizar, de forma gratuita e não exclusiva, sua imagem, voz e nome registrados por meio de fotografias, vídeos, gravações de áudio, depoimentos, entrevistas e outros conteúdos produzidos em atividades, projetos, eventos e ações relacionados à instituição.',
    ],
  },
  {
    title: 'Cláusula 2ª - Da finalidade e dos meios de divulgação',
    body: [
      'O material poderá ser utilizado, no todo ou em parte, exclusivamente para fins institucionais, informativos e educativos, sem finalidade comercial, em materiais de comunicação e divulgação do ICTDF, incluindo: site e canais digitais do ICTDF; redes sociais, como Instagram, Facebook e YouTube; vídeos e materiais institucionais; reportagens e conteúdos destinados à imprensa; televisão e rádio; materiais impressos, campanhas, apresentações e outras peças de comunicação institucional.',
    ],
  },
  {
    title: 'Cláusula 3ª - Da gratuidade',
    body: [
      'A presente cessão é feita a título gratuito. O CEDENTE declara que nada terá a reclamar, a qualquer tempo, a título de remuneração, pagamento, direitos conexos ou indenização pelo uso autorizado de sua imagem, voz e nome, desde que observadas as condições deste termo.',
    ],
  },
  {
    title: 'Cláusula 4ª - Da edição e da preservação da honra',
    body: [
      'O ICTDF poderá editar, recortar, legendar, reproduzir, publicar, distribuir e utilizar o material produzido nos meios previstos neste termo, comprometendo-se a não utilizá-lo de forma que atinja a honra, a boa fama, a respeitabilidade, a intimidade ou a vida privada do CEDENTE, nem para fins comerciais, em conformidade com o art. 5º, inciso X, da Constituição Federal e com o art. 20 do Código Civil.',
    ],
  },
  {
    title: 'Cláusula 5ª - Da abrangência e do prazo',
    body: [
      'Esta cessão é válida em todo o território nacional, inclusive em meios digitais acessíveis a partir dele, e vigora por prazo indeterminado, a contar da data de sua assinatura.',
    ],
  },
  {
    title: 'Cláusula 6ª - Da revogação',
    body: [
      'O CEDENTE poderá revogar esta autorização a qualquer tempo, mediante comunicação por escrito ao ICTDF, com antecedência mínima de 90 (noventa) dias. A revogação não alcança os materiais produzidos, publicados ou distribuídos durante a vigência desta autorização, que poderão permanecer vinculados às ações de comunicação para as quais foram produzidos, não sendo o ICTDF obrigado a recolher materiais já impressos ou veiculados.',
    ],
  },
  {
    title: 'Cláusula 7ª - Da proteção de dados pessoais',
    body: [
      'Os dados pessoais informados neste termo, bem como a imagem e a voz do CEDENTE, serão tratados pelo ICTDF exclusivamente para as finalidades aqui descritas e para o registro desta cessão, com respeito à privacidade e à inviolabilidade da intimidade, da honra e da imagem, nos termos dos arts. 1º e 2º da Lei nº 13.709/2018 (LGPD). O CEDENTE poderá exercer os direitos de titular previstos na LGPD mediante solicitação ao ICTDF pelo e-mail ascom@ictdf.org.br.',
    ],
  },
  {
    title: 'Cláusula 8ª - Das declarações e do foro',
    body: [
      'O CEDENTE declara ser maior de 18 anos e civilmente capaz, ter lido e compreendido integralmente este termo e firmá-lo de forma livre e espontânea, sem qualquer vício de consentimento. Fica eleito o foro da Circunscrição Judiciária de Brasília - DF para dirimir quaisquer questões decorrentes deste termo, com renúncia a qualquer outro, por mais privilegiado que seja.',
    ],
  },
];

const confirmationText =
  'Declaro que li e compreendi as cláusulas acima e cedo, de forma livre e gratuita, ao ICTDF o direito de uso de minha imagem, voz e nome para fins de comunicação e divulgação institucional, conforme as condições deste termo.';

const authorizationText = [
  termTitle,
  'Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF',
  ...termIntro,
  [
    'Dados do CEDENTE',
    'Nome completo: preenchido no formulário',
    'CPF: preenchido no formulário',
    'Data de nascimento: preenchida no formulário',
    'E-mail: preenchido no formulário',
    'Telefone: preenchido no formulário',
  ].join('\n'),
  ...termClauses.map((clause) => [clause.title, ...clause.body].join('\n')),
  `Confirmação\n${confirmationText}`,
].join('\n\n');

const initialForm: FormData = {
  name: '',
  cpf: '',
  birthDate: '',
  email: '',
  phone: '',
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskDate(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildFileName(name: string) {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);

  return `termo-cessao-uso-imagem-voz-nome-ictdf-${normalizedName || 'participante'}-${date}.pdf`;
}

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');
  const [lastPdfUrl, setLastPdfUrl] = useState('');
  const [lastFileName, setLastFileName] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 4 &&
      onlyDigits(form.cpf).length === 11 &&
      onlyDigits(form.birthDate).length === 8 &&
      /.+@.+\..+/.test(form.email) &&
      onlyDigits(form.phone).length >= 10 &&
      accepted &&
      hasSignature &&
      submitState !== 'sending'
    );
  }, [accepted, form, hasSignature, submitState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const previous = document.createElement('canvas');
      previous.width = canvas.width;
      previous.height = canvas.height;
      previous.getContext('2d')?.drawImage(canvas, 0, 0);

      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;

      context.scale(ratio, ratio);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2.5;
      context.strokeStyle = '#E51B3E';
      if (previous.width > 0) {
        context.drawImage(previous, 0, 0, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function updateField(field: keyof FormData, value: string) {
    setSubmitState('idle');
    setMessage('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasSignature(true);
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSubmitState('idle');
    setMessage('');
  }

  function addPdfTextBlock(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    pageHeight: number,
    margin: number,
  ) {
    const lines = doc.splitTextToSize(text, maxWidth);
    let currentY = y;

    lines.forEach((line: string) => {
      if (currentY > pageHeight - 24) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, x, currentY);
      currentY += 5;
    });

    return currentY + 2;
  }

  function ensurePdfSpace(doc: jsPDF, y: number, needed: number, margin: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed <= pageHeight - margin) return y;
    doc.addPage();
    return margin;
  }

  async function createPdf() {
    const signatureDataUrl = canvasRef.current?.toDataURL('image/png') ?? '';
    const logoDataUrl = await imageToDataUrl('/ictdf-logo.png');
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const issuedAt = new Date();
    const dateLabel = issuedAt.toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    doc.addImage(logoDataUrl, 'PNG', margin, 12, 82, 39);
    doc.setTextColor('#173B75');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(termTitle, margin, 64);

    doc.setTextColor('#4A5568');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF', margin, 71);
    doc.text(`Gerado em ${dateLabel}`, margin, 77);
    doc.text(`Destinatário do envio: ${recipientEmail}`, margin, 82);

    doc.setDrawColor('#E51B3E');
    doc.setLineWidth(0.6);
    doc.line(margin, 89, pageWidth - margin, 89);

    doc.setTextColor('#111827');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 101;
    termIntro.forEach((paragraph) => {
      y = addPdfTextBlock(doc, paragraph, margin, y, contentWidth, pageHeight, margin);
    });

    y = ensurePdfSpace(doc, y + 3, 48, margin);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor('#173B75');
    doc.text('Dados do CEDENTE', margin, y);
    y += 8;

    const rows = [
      ['Nome completo', form.name],
      ['CPF', form.cpf],
      ['Data de nascimento', form.birthDate],
      ['E-mail', form.email],
      ['Telefone', form.phone],
    ];

    doc.setFontSize(10);
    rows.forEach(([label, value]) => {
      doc.setTextColor('#173B75');
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setTextColor('#111827');
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 43, y);
      y += 7;
    });

    y += 4;
    termClauses.forEach((section) => {
      y = ensurePdfSpace(doc, y, 18, margin);
      doc.setTextColor('#173B75');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(section.title, margin, y);
      y += 7;
      doc.setTextColor('#111827');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      section.body.forEach((paragraph) => {
        y = addPdfTextBlock(doc, paragraph, margin, y, contentWidth, pageHeight, margin);
        y += 2;
      });
    });

    y = ensurePdfSpace(doc, y + 2, 72, margin);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#173B75');
    doc.setFontSize(11);
    doc.text('Confirmação', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#111827');
    doc.setFontSize(10);
    y = addPdfTextBlock(doc, confirmationText, margin, y, contentWidth, pageHeight, margin);

    y = ensurePdfSpace(doc, y + 6, 50, margin);
    doc.setDrawColor('#CBD5E1');
    doc.roundedRect(margin, y, contentWidth, 36, 2, 2);
    doc.addImage(signatureDataUrl, 'PNG', margin + 4, y + 3, contentWidth - 8, 28);
    y += 44;
    doc.setDrawColor('#173B75');
    doc.line(margin, y, margin + 96, y);
    doc.setTextColor('#111827');
    doc.setFontSize(9);
    doc.text(`${form.name} - CPF ${form.cpf}`, margin, y + 5);
    doc.text(`Data: ${issuedAt.toLocaleDateString('pt-BR')}`, margin, y + 11);

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setTextColor('#64748B');
      doc.setFontSize(8);
      doc.text(
        'Documento gerado digitalmente pela plataforma de cessão de uso de imagem, voz e nome do ICTDF.',
        margin,
        287,
      );
      doc.text(`${page}/${pageCount}`, pageWidth - margin - 8, 287);
    }

    const pdfDataUrl = doc.output('datauristring');
    const pdfBlob = doc.output('blob');
    const fileName = buildFileName(form.name);
    return { fileName, pdfDataUrl, pdfBlob };
  }

  // Envia o PDF como anexo pelo FormSubmit. O upload de arquivos exige um
  // formulário multipart real, então o envio é feito para um iframe oculto
  // para que a página não seja redirecionada.
  function sendByEmail(pdfBlob: Blob, fileName: string, acceptedAt: Date) {
    return new Promise<void>((resolve, reject) => {
      const frameName = `formsubmit-${Date.now()}`;
      const iframe = document.createElement('iframe');
      iframe.name = frameName;
      iframe.style.display = 'none';

      const formElement = document.createElement('form');
      formElement.action = formSubmitEndpoint;
      formElement.method = 'POST';
      formElement.enctype = 'multipart/form-data';
      formElement.target = frameName;
      formElement.style.display = 'none';

      const fields: Record<string, string> = {
        _subject: `Termo de cessão de uso de imagem, voz e nome assinado - ${form.name}`,
        _template: 'table',
        _captcha: 'false',
        Nome: form.name,
        CPF: form.cpf,
        'Data de nascimento': form.birthDate,
        'E-mail': form.email,
        Telefone: form.phone,
        'Aceite registrado em': acceptedAt.toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        formElement.appendChild(input);
      });

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.name = 'attachment';
      const transfer = new DataTransfer();
      transfer.items.add(new File([pdfBlob], fileName, { type: 'application/pdf' }));
      fileInput.files = transfer.files;
      formElement.appendChild(fileInput);

      const cleanup = () => {
        window.clearTimeout(timeout);
        formElement.remove();
        window.setTimeout(() => iframe.remove(), 1000);
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('timeout'));
      }, 30000);
      iframe.addEventListener('load', () => {
        cleanup();
        resolve();
      });

      document.body.appendChild(iframe);
      document.body.appendChild(formElement);
      formElement.submit();
    });
  }

  function downloadPdf(pdfDataUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function submitConsent() {
    if (!canSubmit) {
      setSubmitState('error');
      setMessage('Preencha os campos obrigatórios, marque o aceite e assine o termo.');
      return;
    }

    setSubmitState('sending');
    setMessage('Gerando PDF assinado e preparando envio...');

    try {
      const pdf = await createPdf();
      setLastPdfUrl(pdf.pdfDataUrl);
      setLastFileName(pdf.fileName);

      try {
        await sendByEmail(pdf.pdfBlob, pdf.fileName, new Date());
        setSubmitState('sent');
        setMessage(`Termo assinado enviado para ${recipientEmail}. Uma cópia do PDF também ficou disponível para download.`);
      } catch {
        downloadPdf(pdf.pdfDataUrl, pdf.fileName);
        setSubmitState('downloaded');
        setMessage(
          `Não foi possível enviar o termo por e-mail. O PDF foi baixado; envie-o manualmente para ${recipientEmail}.`,
        );
      }
    } catch {
      setSubmitState('error');
      setMessage('Não foi possível concluir a geração do termo. Revise os dados e tente novamente.');
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/ictdf-logo.png"
              alt="Instituto de Cardiologia e Transplantes do Distrito Federal"
              className="h-16 w-auto sm:h-20"
            />
            <div className="hidden h-12 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--ictdf-blue)]">
                Autorização digital
              </p>
              <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                Uso de imagem, nome e voz
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[var(--ictdf-blue)]">
              <ShieldCheck className="size-4" />
              LGPD e registro de aceite
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-[var(--ictdf-red)]">
              <Mail className="size-4" />
              {recipientEmail}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] lg:py-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ictdf-blue)] text-white">
                <FileSignature className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Seus dados
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Preencha as informações que serão inseridas no PDF assinado.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Digite seu nome completo"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(event) => updateField('cpf', maskCpf(event.target.value))}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento *</Label>
                <Input
                  id="birthDate"
                  value={form.birthDate}
                  onChange={(event) => updateField('birthDate', maskDate(event.target.value))}
                  inputMode="numeric"
                  placeholder="00/00/0000"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="voce@email.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', maskPhone(event.target.value))}
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Assinatura digital
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Assine com mouse, touchpad ou dedo.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={clearSignature}>
                <Eraser className="size-4" />
                Limpar
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
              <canvas
                ref={canvasRef}
                aria-label="Campo de assinatura digital"
                className="h-44 w-full touch-none bg-white"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={(event) => {
                  if (drawingRef.current) stopDrawing(event);
                }}
              />
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <Checkbox
                id="accepted"
                checked={accepted}
                onCheckedChange={(checked) => {
                  setAccepted(Boolean(checked));
                  setSubmitState('idle');
                  setMessage('');
                }}
                className="mt-0.5"
              />
              <Label
                htmlFor="accepted"
                className="block cursor-pointer text-sm leading-6 text-slate-700"
              >
                Li e concordo com todas as cláusulas do termo de cessão de uso de imagem, voz e nome.
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ictdf-red)] text-white">
                <PenLine className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--ictdf-red)]">
                  Leitura obrigatória
                </p>
                <h2 className="text-lg font-semibold text-slate-950">
                  Termo de cessão de uso de imagem, voz e nome
                </h2>
              </div>
            </div>

            <Textarea
              readOnly
              value={authorizationText}
              className="min-h-96 resize-none bg-slate-50 text-sm leading-6 text-slate-700"
            />

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--ictdf-blue)]" />
                <p className="text-sm leading-6 text-slate-700">
                  Ao confirmar, a plataforma gera o PDF com os dados preenchidos,
                  o termo completo, o aceite e a assinatura digital.
                </p>
              </div>
            </div>

            {message ? (
              <div
                className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${
                  submitState === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : submitState === 'sent'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                }`}
                role="status"
              >
                {message}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                disabled={!canSubmit}
                onClick={submitConsent}
                className="h-11 flex-1 bg-[var(--ictdf-red)] hover:bg-[var(--ictdf-red-dark)]"
              >
                <FileSignature className="size-4" />
                {submitState === 'sending' ? 'Enviando...' : 'Confirmar aceite'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                disabled={!lastPdfUrl}
                onClick={() => downloadPdf(lastPdfUrl, lastFileName)}
                className="h-11"
                aria-label="Baixar cópia do PDF"
              >
                <Download className="size-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <span>ICTDF - Instituto de Cardiologia e Transplantes do Distrito Federal</span>
          <span>Uso de imagem, nome e voz · Comunicação institucional · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
