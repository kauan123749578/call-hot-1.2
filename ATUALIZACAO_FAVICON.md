# 🔖 Atualização do Favicon (Ícone da Aba)

## ✅ Alterações Realizadas

### 1. **Atualizado `app/icon.tsx`**
- ✅ Substituído o ícone genérico pela logo SVG do CallHot
- ✅ Usa a mesma logo que aparece no login e no AppShell
- ✅ Cores: fundo preto (#0a0a0a), logo vermelha (#d61f1f)

### 2. **Atualizado `app/layout.tsx`**
- ✅ Adicionado metadata com referências explícitas ao ícone
- ✅ Links para `/icon.png` e apple-touch-icon

## 📋 Arquivo Atualizado

**Arquivo:** `app/icon.tsx`
- Agora usa a mesma logo SVG do CallHot (círculo com play button e indicador de chamada)

**Arquivo:** `app/layout.tsx`
- Adicionado metadata.icons para garantir que o favicon seja carregado

## 🚀 Como Funciona

No Next.js 13+, o arquivo `app/icon.tsx` é automaticamente usado para gerar:
- `/favicon.ico`
- `/icon.png`
- `/apple-icon.png`

O Next.js compila o SVG e gera os arquivos automaticamente.

## ⚠️ Importante

Após fazer push:
1. O Next.js vai recompilar e gerar o novo favicon
2. Pode levar alguns segundos para aparecer
3. Se não aparecer imediatamente:
   - Limpe o cache do navegador (Ctrl+Shift+Delete)
   - Ou faça hard refresh (Ctrl+F5)
   - Ou abra em aba anônima

## 📦 Para Fazer Push

```bash
git add app/icon.tsx
git add app/layout.tsx

git commit -m "feat: Atualiza favicon para usar logo do CallHot

- Substitui ícone genérico pela logo SVG do CallHot
- Adiciona metadata.icons no layout
- Favicon agora usa a mesma logo do login e AppShell"

git push origin main
```

## ✅ Resultado Esperado

Após o deploy, o favicon na aba do navegador deve mostrar:
- Logo do CallHot (círculo preto com borda vermelha)
- Play button vermelho
- Indicador de chamada (círculo pequeno)


