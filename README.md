# Viloyalhome

App/PWA para **escanear imóveis a partir de uma foto**: captura a localização,
identifica o endereço no mapa e reúne o cadastro público, a matrícula e os
próximos passos.

- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Mapa:** Leaflet + tiles do OpenStreetMap
- **Geocodificação reversa:** provedor plugável — Google/Mapbox (rua+número
  confiáveis) com fallback automático para Nominatim/OSM (grátis, cobertura
  variável) — via rota `/api/geocode`, server-side. Veja `lib/geocode/`.
- **EXIF:** `exifr` (lê GPS embutido na foto, quando existe)

## Como funciona (v1)

1. O usuário tira uma foto na frente do imóvel (câmera do celular).
2. O app pega a **localização do aparelho** (GPS). Se falhar, tenta o **GPS
   embutido na foto (EXIF)**.
3. A coordenada é convertida em **endereço** (geocodificação reversa).
4. Monta-se a **ficha do imóvel**: foto, endereço, coordenadas, mapa (com
   pino arrastável e edição manual do endereço) e cards de próximos passos.

### O que é dado real x deep-link

| Recurso | Status no v1 |
| --- | --- |
| Foto + GPS + endereço + mapa | ✅ Real, funcionando |
| Ajuste do endereço (pino arrastável / edição manual) | ✅ Real — cobre os casos em que o geocoder erra (condomínios, ruas sem numeração completa) |
| Google Maps / Street View | ✅ Deep-link por coordenada |
| Cadastro público (área, testada, inscrição, matrícula, cartório) | ⚙️ Consulta automática por coordenada (geoportal) — adaptador pronto, precisa do endpoint do município configurado |
| Valor venal (IPTU) | ❌ Não é público em nenhum município — protegido por sigilo fiscal (CTN art. 198), só o proprietário acessa com login. Ver nota abaixo. |
| Matrícula (Registro de Imóveis) | 🔗 Deep-link p/ ONR (pedido de certidão, oficial e pago) |
| Anúncios (à venda) | 🔗 Busca por endereço nos portais (sem raspagem) |

## Geoportal (cadastro público por coordenada)

O app consulta a **parcela cadastral** sob a coordenada e devolve inscrição,
áreas, endereço cadastral e (quando exposto) proprietário. O adaptador é
**provider-agnóstico** e suporta os dois padrões mais comuns em prefeituras
brasileiras:

- **ArcGIS REST** (`GEOPORTAL_KIND=arcgis`): aponta para a camada
  (`…/MapServer/0` ou `…/FeatureServer/0`); o app usa a operação `query` por
  ponto.
- **WMS** (`GEOPORTAL_KIND=wms`): usa `GetFeatureInfo` (consultado em
  EPSG:3857 para evitar a troca de eixos do WMS 1.3.0).

Os nomes das colunas variam por município — o mapeamento em
`lib/geoportal/config.ts` já tenta vários candidatos e pode ser sobrescrito via
`GEOPORTAL_FIELDS` (JSON). Veja `.env.local.example`.

> **Valor venal não é (e não deveria ser) automatizável.** Inspecionamos o
> GeoCascavel (`geocascavel.cascavel.pr.gov.br`) manualmente via DevTools: o
> visualizador mostra dados cadastrais reais e públicos por lote — endereço,
> área do terreno, testada, inscrição, matrícula e até o cartório responsável
> — mas a coluna "Valor" fica sempre vazia em todas as abas. Isso bate com o
> sigilo fiscal do CTN (art. 198): valor venal é dado tributário, só o
> proprietário acessa via login. O portal também é protegido por reCAPTCHA,
> um sinal explícito de que consultas automatizadas não são bem-vindas — por
> isso não construímos um scraper para contornar isso; o link
> `cascavelGeoLink()` continua sendo um deep-link manual.

### Arquitetura

```
lib/geoportal/
  config.ts   # lê env, mapeamento de campos padrão
  arcgis.ts   # adaptador ArcGIS REST (query por ponto)
  wms.ts      # adaptador WMS GetFeatureInfo
  map.ts      # normaliza atributos crus -> ParcelInfo
  index.ts    # dispatch + resultado tipado (available/not_found/not_configured/error)
app/api/geoportal/route.ts   # GET ?lat&lon -> resultado
components/CadastreCard.tsx   # card do dossiê que consome a rota
```

> **Por quê deep-links?** Matrícula não tem API pública gratuita (é via ONR,
> paga). Portais de anúncio (VivaReal/Zap/OLX) não têm API pública e raspagem
> fere os termos deles. Geoportais de cadastro existem **por município** —
> Cascavel entra como piloto e cada cidade nova é um adaptador.

## Rodar localmente

```bash
npm install
cp .env.local.example .env.local   # ajuste o contato do geocoder
npm run dev
```

Acesse http://localhost:3000. **A câmera e o GPS só funcionam em HTTPS** (ou em
`localhost`); em produção, sirva sob HTTPS.

## Próximas fases

- Integração real por coordenada com o geoportal de Cascavel (cadastro
  público: inscrição, área, testada, matrícula, cartório — não valor venal,
  ver nota acima).
- Adaptadores de geoportal para outras cidades.
- Fluxo de pedido de matrícula com pré-preenchimento e acompanhamento.
- Conta de usuário + sincronização do histórico (hoje é `localStorage`).
