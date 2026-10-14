# Termo de cessão de uso de imagem, nome e voz – ICTDF

Site estático (Vite + React) para assinatura digital do termo. Ao confirmar o
aceite, o PDF assinado é enviado para ascom@ictdf.org.br pelo FormSubmit.

## Rodar localmente

    npm install
    npm run dev

## Deploy (Netlify)

As configurações estão em `netlify.toml`: comando `npm run build`, pasta
`dist`, Node 22.

Na primeira assinatura, o FormSubmit envia um e-mail de ativação para
ascom@ictdf.org.br. É preciso clicar no link de ativação para que os termos
passem a chegar.
