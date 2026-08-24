# Painel de Unidades de Saúde de Pernambuco

Primeira versão funcional de um portal para consulta das unidades de saúde presentes na planilha fornecida. O projeto segue a linguagem institucional do painel IPS usado como referência, com lista completa, filtros, mapa municipal e ficha técnica imprimível.

## O que está pronto

- 73 unidades publicadas: 65 em funcionamento e 8 em construção.
- Busca textual por unidade, endereço, município, RD e GERES.
- Filtros específicos de município, RD, GERES, tipo e status.
- Tabela com os campos solicitados e exportação CSV.
- Mapa offline de Pernambuco com símbolos por tipo, agrupamento por município, tipo e status, distribuição anticolisão e vínculo visual ao município. Unidades em construção usam contorno tracejado.
- Ficha técnica individual com status, leitos operacionais ou previstos e impressão ou salvamento em PDF pelo navegador.
- Pipeline reproduzível da planilha para JSON, com relatório de qualidade e correções auditáveis.
- Layout responsivo inspirado em `C:\workspace\ips`.

## Executar

Requisitos: Node.js 20+ e Python 3.11+.

```powershell
python -m pip install -r requirements.txt
npm install
npm run build:data
npm run dev
```

O endereço local padrão é `http://localhost:5173`.

## Validação

```powershell
npm test
npm run typecheck
npm run build
```

## Dados

- Fonte preservada: `data/raw/health-units.xlsx`.
- Geometria municipal local: `data/reference/pernambuco-map.json`.
- Saída usada pelo app: `public/data/health-units.json`.
- Relatório auditável: `data/processed/data-quality.json`.
- Transformação: `scripts/build_data.py`.

O conjunto publicado combina as abas `Consolidado` e `UNIDADES EM CONSTRUÇÃO`. O pipeline usa a aba `0_Template_Cod_Mun_RD` da própria planilha para preencher código IBGE e RD por município, complementa GERES ausentes pelo valor consistente das outras unidades do mesmo município e recupera informações disponíveis nas abas de origem, sem modificar a planilha.

O recorte atual contém 73 unidades em 25 municípios, sendo 8 obras em 6 municípios. Há 6.796 leitos operacionais em 50 unidades em funcionamento e 861 leitos previstos em 5 unidades em construção. Os tipos informados pela fonte totalizam 40 hospitais, 14 UPAs, 15 UPAEs e 4 UPAE-Rs.

## Limitações conhecidas da fonte

- A planilha não contém latitude e longitude. O mapa organiza os símbolos em uma grade esquemática sem sobreposição e usa linhas-guia até o centro visual do município; a interface declara que isso não representa o endereço da unidade.
- Contrato de manutenção está preenchido em apenas 16 das 65 unidades em funcionamento.
- Leitos operacionais são numéricos em 50 unidades em funcionamento. Entre as obras, 5 possuem quantidade prevista informada; os demais valores ausentes continuam visíveis como `Não informado`.
- O valor `Especializado` em `Tipo Gestão` para o Hemope foi preservado, mas requer validação semântica pela área responsável.

As correções de município e GERES aplicadas por evidência do endereço ou fonte oficial estão listadas em `data/processed/data-quality.json`, com a linha original e o link de comprovação.
