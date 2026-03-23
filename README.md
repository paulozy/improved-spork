# 🃏 Scrum Poker

Aplicação de planning poker para times ágeis, feita com Next.js 14 e pronta para Vercel.

## Features

- 🏠 Criar sala com código de 6 letras compartilhável
- 👥 Múltiplos participantes em tempo real (polling 2.5s)
- 🃏 Cards editáveis com presets (Fibonacci, T-Shirt, 1–10, Powers of 2)
- 📊 Resultado com média, min, max e gráfico de distribuição
- 🎉 Detecção de consenso automática
- 🔄 "Nova Rodada" reseta todos os votos
- 📝 Campo de história/tarefa visível para todos
- 📱 Responsivo (mobile-friendly)

## Deploy na Vercel (rápido)

### Opção 1 — Via GitHub (recomendado)

```bash
git init
git add .
git commit -m "init scrum poker"
# Crie um repo no GitHub e faça push
git remote add origin https://github.com/seu-user/scrum-poker.git
git push -u origin main
```

Depois vá em [vercel.com](https://vercel.com), clique em **Add New → Project**, importe o repo e clique **Deploy**. Pronto!

### Opção 2 — Via Vercel CLI

```bash
npm i -g vercel
npm install
vercel
```

## Rodar localmente

```bash
npm install
npm run dev
# Abra http://localhost:3000
```

## Arquitetura

| Arquivo | Função |
|---|---|
| `app/page.tsx` | Home: criar ou entrar em sala |
| `app/room/[id]/page.tsx` | Sala de votação |
| `app/api/room/route.ts` | CRUD de salas |
| `app/api/vote/route.ts` | Registrar votos / participantes |
| `lib/store.ts` | In-memory store (global cache) |
| `lib/types.ts` | Tipos + calcStats() |

## Persistência

Por padrão usa memória in-process. Funciona bem para sessões curtas na Vercel (cada instância mantém seu estado).

Para persistência real entre deploys, substitua `lib/store.ts` por **Upstash Redis** (gratuito até 10k req/dia):

```bash
npm install @upstash/redis
```

```ts
// lib/store.ts
import { Redis } from "@upstash/redis";
const redis = new Redis({ url: process.env.UPSTASH_URL!, token: process.env.UPSTASH_TOKEN! });

export async function getRoom(id: string) {
  return redis.get<Room>(id);
}
export async function setRoom(room: Room) {
  room.updatedAt = Date.now();
  await redis.set(room.id, room, { ex: 86400 }); // expira em 24h
}
```
