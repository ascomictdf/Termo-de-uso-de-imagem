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

const authorizationText = `AUTORIZAÇÃO DE USO DE IMAGEM, NOME E VOZ
Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF

O Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF realiza registros em fotos, vídeos e áudios para divulgar suas atividades, projetos, eventos, ações e conteúdos institucionais.

Ao preencher e assinar este termo, você autoriza o ICTDF a utilizar sua imagem, nome e/ou voz nos termos descritos abaixo.

Seus dados
Nome completo: preenchido no formulário
CPF: preenchido no formulário
Data de nascimento: preenchida no formulário
E-mail: preenchido no formulário
Telefone: preenchido no formulário

O que estou autorizando?
Autorizo, de forma gratuita e não exclusiva, o ICTDF a utilizar minha imagem, nome e/ou voz registrados por meio de fotografias, vídeos, gravações de áudio, depoimentos, entrevistas e outros conteúdos produzidos em atividades relacionadas à instituição.

Essa autorização permite que o conteúdo seja utilizado, no todo ou em parte, em materiais de comunicação e divulgação do ICTDF, incluindo:
site e canais digitais do ICTDF;
redes sociais, como Instagram, Facebook e YouTube;
vídeos e materiais institucionais;
reportagens e conteúdos destinados à imprensa;
televisão e rádio;
materiais impressos, campanhas, apresentações e outras peças de comunicação institucional.

Condições da autorização
1. Esta autorização é concedida de forma gratuita, portanto não haverá pagamento ou indenização pelo uso autorizado da minha imagem, nome ou voz.
2. O ICTDF poderá editar, reproduzir, publicar, distribuir e utilizar o material produzido nos meios de comunicação previstos nesta autorização.
3. A autorização é válida em todo o território nacional e por prazo indeterminado.
4. Caso eu queira solicitar o encerramento desta autorização, deverei comunicar o ICTDF por escrito, com antecedência mínima de 90 dias, conforme previsto neste termo.
5. Os materiais produzidos e publicados durante o período de vigência desta autorização poderão permanecer vinculados às ações de comunicação para as quais foram produzidos, observadas as condições deste termo.

Confirmação
Declaro que li e compreendi as informações acima e autorizo, de forma livre e gratuita, o ICTDF a utilizar minha imagem, nome e/ou voz para fins de comunicação e divulgação institucional, conforme as condições deste termo.`;

const pdfTermSections = [
  {
    title: 'O que estou autorizando?',
    body: [
      'Autorizo, de forma gratuita e não exclusiva, o ICTDF a utilizar minha imagem, nome e/ou voz registrados por meio de fotografias, vídeos, gravações de áudio, depoimentos, entrevistas e outros conteúdos produzidos em atividades relacionadas à instituição.',
      'Essa autorização permite que o conteúdo seja utilizado, no todo ou em parte, em materiais de comunicação e divulgação do ICTDF, incluindo: site e canais digitais do ICTDF; redes sociais, como Instagram, Facebook e YouTube; vídeos e materiais institucionais; reportagens e conteúdos destinados à imprensa; televisão e rádio; materiais impressos, campanhas, apresentações e outras peças de comunicação institucional.',
    ],
  },
  {
    title: 'Condições da autorização',
    body: [
      '1. Esta autorização é concedida de forma gratuita, portanto não haverá pagamento ou indenização pelo uso autorizado da minha imagem, nome ou voz.',
      '2. O ICTDF poderá editar, reproduzir, publicar, distribuir e utilizar o material produzido nos meios de comunicação previstos nesta autorização.',
      '3. A autorização é válida em todo o território nacional e por prazo indeterminado.',
      '4. Caso eu queira solicitar o encerramento desta autorização, deverei comunicar o ICTDF por escrito, com antecedência mínima de 90 dias, conforme previsto neste termo.',
      '5. Os materiais produzidos e publicados durante o período de vigência desta autorização poderão permanecer vinculados às ações de comunicação para as quais foram produzidos, observadas as condições deste termo.',
    ],
  },
];

const confirmationText =
  'Declaro que li e compreendi as informações acima e autorizo, de forma livre e gratuita, o ICTDF a utilizar minha imagem, nome e/ou voz para fins de comunicação e divulgação institucional, conforme as condições deste termo.';

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

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.split(',')[1] ?? '';
}

function buildFileName(name: string) {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);

  return `autorizacao-uso-imagem-nome-voz-ictdf-${normalizedName || 'participante'}-${date}.pdf`;
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
    doc.text('AUTORIZAÇÃO DE USO DE IMAGEM, NOME E VOZ', margin, 64);

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
    let y = addPdfTextBlock(
      doc,
      'O Instituto de Cardiologia e Transplantes do Distrito Federal - ICTDF realiza registros em fotos, vídeos e áudios para divulgar suas atividades, projetos, eventos, ações e conteúdos institucionais.',
      margin,
      101,
      contentWidth,
      pageHeight,
      margin,
    );
    y = addPdfTextBlock(
      doc,
      'Ao preencher e assinar este termo, você autoriza o ICTDF a utilizar sua imagem, nome e/ou voz nos termos descritos abaixo.',
      margin,
      y,
      contentWidth,
      pageHeight,
      margin,
    );

    y = ensurePdfSpace(doc, y + 3, 48, margin);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor('#173B75');
    doc.text('Seus dados', margin, y);
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
    pdfTermSections.forEach((section) => {
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
        'Documento gerado digitalmente pela plataforma de autorização de uso de imagem, nome e voz do ICTDF.',
        margin,
        287,
      );
      doc.text(`${page}/${pageCount}`, pageWidth - margin - 8, 287);
    }

    const pdfDataUrl = doc.output('datauristring');
    const fileName = buildFileName(form.name);
    return { fileName, pdfDataUrl, pdfBase64: dataUrlToBase64(pdfDataUrl) };
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

      const response = await fetch('/api/send-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: pdf.fileName,
          pdfBase64: pdf.pdfBase64,
          participant: form,
          acceptedAt: new Date().toISOString(),
        }),
      });
      const result = (await response.json()) as {
        sent?: boolean;
        message?: string;
      };

      if (response.ok && result.sent) {
        setSubmitState('sent');
        setMessage(`Termo enviado para ${recipientEmail}. Uma cópia do PDF também ficou disponível para download.`);
        return;
      }

      downloadPdf(pdf.pdfDataUrl, pdf.fileName);
      setSubmitState('downloaded');
      setMessage(
        result.message ??
          'PDF gerado. O envio automático ainda precisa ser configurado no servidor; o arquivo foi baixado para envio manual.',
      );
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
                Li e concordo com o termo de uso de imagem.
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
                  Autorização de uso de imagem, nome e voz
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
