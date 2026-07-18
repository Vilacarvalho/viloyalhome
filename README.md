# Viloyalhome

App/PWA para **escanear imóveis a partir de uma foto**: captura a localização,
identifica o endereço no mapa e reúne os próximos passos (valor venal,
matrícula, anúncios).

Projeto independente — não tem relação com o painel do Studio Fernando Tinoco;
vive nesta pasta apenas por conveniência de repositório e pode ser movido para
um repositório próprio a qualquer momento.

- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Mapa:** Leaflet + tiles do OpenStreetMap
- **Geocodificação reversa:** Nominatim (via rota `/api/geocode`, server-side)
- **EXIF:** `exifr` (lê GPS embutido na foto, quando existe)

## Como funciona (v1)

1. O usuário tira uma foto na frente do imóvel (câmera do celular).
2. O app pega a **localização do aparelho** (GPS). Se falhar, tenta o **GPS
   embutido na foto (EXIF)**.
3. A coordenada é convertida em **endereço** (geocodificação reversa).
4. Monta-se a **ficha do imóvel**: foto, endereço, coordenadas, mapa e cards de
   próximos passos.

### O que é dado real x deep-link

| Recurso | Status no v1 |
| --- | --- |
| Foto + GPS + endereço + mapa | ✅ Real, funcionando |
| Google Maps / Street View | ✅ Deep-link por coordenada |
| Valor venal / cadastro (IPTU) | ⚙️ Consulta automática por coordenada (geoportal) — pronta, precisa do endpoint do município configurado |
| Matrícula (Registro de Imóveis) | 🔗 Deep-link p/ ONR (pedido de certidão, oficial e pago) |
| Anúncios (à venda) | 🔗 Busca por endereço nos portais (sem raspagem) |

## Geoportal (cadastro + valor venal automáticos)

O app consulta a **parcela cadastral** sob a coordenada e devolve inscrição,
valor venal (IPTU), áreas, endereço cadastral e proprietário (quando público).
O adaptador é **provider-agnóstico** e suporta os dois padrões mais comuns em
prefeituras brasileiras:

- **ArcGIS REST** (`GEOPORTAL_KIND=arcgis`): aponta para a camada
  (`…/MapServer/0` ou `…/FeatureServer/0`); o app usa a operação `query` por
  ponto.
- **WMS** (`GEOPORTAL_KIND=wms`): usa `GetFeatureInfo` (consultado em
  EPSG:3857 para evitar a troca de eixos do WMS 1.3.0).

Os nomes das colunas variam por município — o mapeamento em
`lib/geoportal/config.ts` já tenta vários candidatos e pode ser sobrescrito via
`GEOPORTAL_FIELDS` (JSON). Veja `.env.local.example`.

> **Cascavel/PR (cidade piloto):** a URL da camada cadastral precisa ser
> confirmada numa rede que alcance `*.cascavel.pr.gov.br`. O ambiente de
> desenvolvimento remoto bloqueia esse host por política de egresso, então o
> endpoint fica configurável por env em vez de fixado no código. Enquanto não
> configurado, o card mostra o link do portal oficial de Cascavel como
> alternativa manual.

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
> fere os termos deles. Geoportais de valor venal existem **por município** —
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

- Integração real por coordenada com o geoportal de Cascavel (WMS/WFS) →
  puxar inscrição cadastral e valor venal automaticamente.
- Adaptadores de geoportal para outras cidades.
- Fluxo de pedido de matrícula com pré-preenchimento e acompanhamento.
- Conta de usuário + sincronização do histórico (hoje é `localStorage`).
