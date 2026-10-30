# Termo de cessão de uso de imagem, nome e voz – ICTDF

Site (Vite + React) para assinatura digital do termo, hospedado na Vercel.
Ao confirmar o aceite, o navegador gera o PDF assinado e o envia para a função
`api/send-consent.ts`, que o encaminha por e-mail (SMTP) para
ascom@ictdf.org.br, com o nome completo de quem assinou.

Se o envio falhar, o PDF é baixado no aparelho da pessoa para envio manual.

## Deploy na Vercel

1. Importe o repositório na Vercel (Add New → Project) e clique em Deploy.
   As configurações de build estão em `vercel.json`.
2. Configure o envio de e-mail em Project → Settings → Environment Variables
   (uma das opções abaixo) e faça um novo deploy (Deployments → Redeploy).

### Opção simples: Resend (recomendada)

1. Crie uma conta gratuita em resend.com usando o e-mail **ascom@ictdf.org.br**.
2. Em API Keys, crie uma chave (permissão "Sending access").
3. Na Vercel, cadastre a variável `RESEND_API_KEY` com essa chave.

Sem domínio verificado, o Resend envia pelo remetente `onboarding@resend.dev`
e somente para o e-mail com que a conta foi criada. Para enviar com remetente
`@ictdf.org.br`, verifique o domínio no Resend e defina `EMAIL_FROM`.

### Opção alternativa: servidor SMTP próprio

| Variável    | Exemplo (Microsoft 365)       |
| ----------- | ----------------------------- |
| `SMTP_HOST` | `smtp.office365.com`          |
| `SMTP_PORT` | `587`                         |
| `SMTP_USER` | `ascom@ictdf.org.br`          |
| `SMTP_PASS` | senha de aplicativo da conta  |

Opcionais para as duas opções: `EMAIL_FROM` (remetente) e `EMAIL_TO`
(destinatário, padrão ascom@ictdf.org.br).

## Rodar localmente

    npm install
    npm run dev          # apenas o site (o envio de e-mail não funciona)
    npx vercel dev       # site + função de e-mail, lendo o arquivo .env
