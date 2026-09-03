# Painel de Unidades de Saúde de Pernambuco

Primeira versão funcional de um portal para consulta das unidades de saúde presentes na planilha fornecida. O projeto segue a linguagem institucional do painel IPS usado como referência, com lista completa, filtros, mapa municipal e ficha técnica imprimível.

## O que está pronto

- 98 registros publicados: 65 unidades em funcionamento, 8 em construção e 25 da Rede Credenciada com status não informado na fonte.
- Busca textual por unidade, endereço, município, RD e GERES.
- Filtros específicos de município, RD, GERES, tipo e status.
- Tabela com os campos solicitados, resumo de expansão de leitos e exportação CSV com os três novos campos separados.
- Mapa offline de Pernambuco com uma marca por unidade distribuída dentro do respectivo município. Hospitais usam símbolo ampliado com cruz assistencial, as demais unidades usam pontos neutros e o contorno tracejado indica obra em andamento. Filtros combináveis controlam tipos, status, avanços, expansão de leitos e investimento.
- Ficha técnica individual com status, leitos operacionais ou previstos, expansão de leitos na gestão e impressão ou salvamento em PDF pelo navegador.
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

O recorte atual contém 98 registros em 31 municípios: 65 unidades em funcionamento, 8 obras e 25 registros da Rede Credenciada sem status informado. Há 6.796 leitos operacionais em 50 unidades em funcionamento e 861 leitos previstos em 5 unidades em construção. A base também informa 726 leitos abertos nesta gestão em 27 registros — 696 na Rede Credenciada e 30 em hospitais da rede — e 543 leitos a abrir após reformas em 4 hospitais; esses indicadores de expansão permanecem separados dos totais operacional e de obras. A taxonomia publicada totaliza 40 hospitais, 25 unidades da Rede Credenciada, 14 UPAs, 15 UPAEs e 4 UPAE-Rs.

## Limitações conhecidas da fonte

- A planilha não contém latitude e longitude. O mapa distribui os símbolos de forma ilustrativa dentro do polígono municipal para representar cada registro sem sugerir seu endereço exato; a interface declara essa limitação junto ao mapa.
- Contrato de manutenção está preenchido em apenas 16 das 65 unidades em funcionamento.
- Leitos operacionais são numéricos em 50 unidades em funcionamento. Entre as obras, 5 possuem quantidade prevista informada; os demais valores ausentes continuam visíveis como `Não informado`.
- Leitos abertos nesta gestão e seus tipos estão preenchidos em 2 unidades; leitos a abrir após reformas estão preenchidos em 4 unidades. A cobertura limitada fica explícita no painel e no relatório de qualidade.
- O rótulo `Grandes Emergências` encontrado na coluna `Tipo` em 6 hospitais é normalizado como `Hospital` para preservar a taxonomia de tipo de unidade usada pelo painel; o cabeçalho original permanece auditável na planilha-fonte.
- Os 25 registros da Rede Credenciada não possuem status, endereço, leitos, perfil ou gestão na fonte. Seis deles também não possuem GERES recuperável por outro registro do mesmo município; as lacunas permanecem como `Não informado`.
- `Hospital Memorial de Pernambuco`, em Caruaru, aparece nas linhas 91 e 93 com detalhes diferentes de expansão de leitos. Os dois registros foram preservados e a possível duplicidade por nome e município está documentada no relatório de qualidade.
- O valor `Especializado` em `Tipo Gestão` para o Hemope foi preservado, mas requer validação semântica pela área responsável.

As correções de município e GERES aplicadas por evidência do endereço ou fonte oficial estão listadas em `data/processed/data-quality.json`, com a linha original e o link de comprovação.
