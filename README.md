# Painel de Unidades de Saúde de Pernambuco

Portal para consulta das unidades de saúde de Pernambuco, com lista completa, filtros, mapa municipal, ficha técnica e exportação do mapa em JPG.

## O que está pronto

- 98 registros: 65 unidades em funcionamento, 8 em construção e 25 da Rede Credenciada sem status informado na fonte.
- Busca por unidade, endereço, município, RD e GERES.
- Filtros com seleção múltipla por município, RD, GERES, tipo e status.
- Mapa offline com os marcadores contidos no município e exportação JPG de alta resolução.
- Ficha técnica individual com impressão ou salvamento em PDF pelo navegador.
- Relatório completo com capa e uma ficha técnica por unidade para impressão ou PDF.
- Tela exclusiva das novas unidades em construção, com capacidade prevista, território e perfil assistencial.
- Pipeline somente leitura do Google Drive, com reconciliação das abas de origem, validação e última versão válida.

## Executar

Requisitos: Node.js 20+ e Python 3.11+.

```powershell
python -m pip install -r requirements.txt
npm install
npm run build:data
npm run dev
```

O endereço local padrão é `http://localhost:5173`.

Para baixar e validar a versão mais recente do Google Drive:

```powershell
npm run sync:data
```

O comando apenas exporta uma cópia XLSX da planilha; ele não escreve nem altera células no Google Drive.

## Validação

```powershell
npm test
npm run typecheck
npm run build
```

## Pipeline de dados

- Fonte principal: aba `[NÃO MEXER] Consolidado` da planilha no Google Drive.
- Abas de recuperação: `Hospitais Regionais e OSS`, `Os Seis Grandes`, `UPA e UPA-E`, `Rede Credenciada` e `UNIDADES EM CONSTRUÇÃO`.
- Referência territorial: `0_Template_Cod_Mun_RD`.
- Snapshot local preservado: `data/raw/health-units.xlsx`.
- Saída do app: `public/data/health-units.json`.
- Relatório auditável: `data/processed/data-quality.json`.
- Transformação e reconciliação: `scripts/build_data.py`.
- Download, validação e publicação atômica: `scripts/sync_google_sheet.py`.
- Execução diária e manual: `.github/workflows/sync-health-data.yml`.

O consolidado é a camada principal. Campos ausentes ou com erro de fórmula são recuperados primeiro das abas de origem. Se ainda houver lacunas, somente campos compatíveis do último JSON válido são herdados, com registro por unidade em `source.inheritedFields`. As referências usadas ficam em `source.references`.

Antes de publicar, a sincronização verifica a aba correta, quantidade mínima de registros por grupo, IDs duplicados, município/RD/IBGE, leitos previstos, recuperação de erros de fórmula e quedas superiores a 20% nos indicadores principais. Se uma trava falhar, nenhum artefato (`XLSX`, `JSON` ou relatório) é substituído.

## Recorte atual

- 98 registros em 30 municípios.
- 6.796 leitos operacionais em 50 unidades.
- 861 leitos previstos em 5 obras.
- 865 leitos abertos nesta gestão em 38 registros.
- 642 leitos a abrir após reformas em 5 unidades.
- 40 hospitais, 25 unidades da Rede Credenciada, 14 UPAs, 16 UPAEs e 3 UPAE-Rs.

## Limitações conhecidas

- A planilha não contém latitude e longitude. Os símbolos são distribuídos de forma ilustrativa dentro do polígono municipal.
- Valores ausentes continuam nulos e são exibidos como `Não informado`.
- Os 25 registros da Rede Credenciada não possuem status operacional na fonte; seis também não possuem GERES recuperável.
- `Hospital Memorial de Pernambuco`, em Caruaru, aparece duas vezes na aba da Rede Credenciada. Os dois registros foram preservados e a possível duplicidade está documentada.
- O valor `Especializado` em `Tipo Gestão` para o Hemope foi preservado e requer validação semântica pela área responsável.
