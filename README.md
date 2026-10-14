# Termo de cessão de uso de imagem, nome e voz – ICTDF

Site estático (Vite + React) para assinatura digital do termo. Ao confirmar o
aceite, o PDF assinado é enviado para ascom@ictdf.org.br pelo FormSubmit.

## Rodar localmente

    npm install
    npm run dev

## Deploy (Vercel)

Importe o repositório na Vercel. As configurações estão em `vercel.json`
(framework Vite, comando `npm run build`, pasta `dist`) e a versão do Node
(22.x) em `package.json`.

Na primeira assinatura, o FormSubmit envia um e-mail de ativação para
ascom@ictdf.org.br. É preciso clicar no link de ativação para que os termos
passem a chegar.
