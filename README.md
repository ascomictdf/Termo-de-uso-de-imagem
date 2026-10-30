# Termo de cessão de uso de imagem, nome e voz – ICTDF

Site (Vite + React) para assinatura digital do termo, hospedado na Vercel.
Ao confirmar o aceite, o navegador gera o PDF assinado e o envia para a função
`api/send-consent.ts`, que o encaminha por e-mail (SMTP) para
ascom@ictdf.org.br, com o nome completo de quem assinou.

Se o envio falhar, o PDF é baixado no aparelho da pessoa para envio manual.

## Deploy na Vercel

1. Importe o repositório na Vercel (Add New → Project) e clique em Deploy.
   As configurações de build estão em `vercel.json`.
2. Em Project → Settings → Environment Variables, cadastre:

   | Variável    | Exemplo                       | Obrigatória |
   | ----------- | ----------------------------- | ----------- |
   | `SMTP_HOST` | `smtp.gmail.com`              | sim         |
   | `SMTP_PORT` | `465`                         | não (465)   |
   | `SMTP_USER` | `ascom@ictdf.org.br`          | sim         |
   | `SMTP_PASS` | senha de aplicativo da conta  | sim         |
   | `EMAIL_FROM`| `Termos ICTDF <ascom@ictdf.org.br>` | não (usa `SMTP_USER`) |
   | `EMAIL_TO`  | `ascom@ictdf.org.br`          | não (ascom@ictdf.org.br) |

3. Faça um novo deploy (Deployments → Redeploy) para as variáveis valerem.

Servidores SMTP comuns:

- Google Workspace / Gmail: `smtp.gmail.com`, porta `465`, com senha de app.
- Microsoft 365 / Outlook: `smtp.office365.com`, porta `587`.
- Resend: `smtp.resend.com`, porta `465`, usuário `resend`, senha = API key.

## Rodar localmente

    npm install
    npm run dev          # apenas o site (o envio de e-mail não funciona)
    npx vercel dev       # site + função de e-mail, lendo o arquivo .env
