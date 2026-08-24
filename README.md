# Painel de Unidades de Saúde de Pernambuco

Primeira versão funcional de um portal para consulta das unidades de saúde presentes na planilha fornecida. O projeto segue a linguagem institucional do painel IPS usado como referência, com lista completa, filtros, mapa municipal e ficha técnica imprimível.

## O que está pronto

- 65 unidades ativas da aba `Consolidado`.
- Busca textual por unidade, endereço, município, RD e GERES.
- Filtros específicos de município, RD, GERES e tipo.
- Tabela com os campos solicitados e exportação CSV.
- Mapa offline de Pernambuco com símbolos e cores por tipo de unidade.
- Ficha técnica individual com impressão ou salvamento em PDF pelo navegador.
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

O pipeline usa a aba `0_Template_Cod_Mun_RD` da própria planilha para preencher código IBGE e RD por município. GERES ausentes são completadas pelo valor consistente das outras unidades do mesmo município. Valores de investimento que não chegaram ao `Consolidado` são recuperados das abas de origem, sem modificar a planilha.

## Limitações conhecidas da fonte

- A planilha não contém latitude e longitude. O mapa posiciona os símbolos no centro visual do município e declara essa limitação na interface.
- Oito unidades da aba `UNIDADES EM CONSTRUÇÃO` não integram o `Consolidado` e ficaram fora desta primeira versão.
- Contrato de manutenção está preenchido em apenas 16 das 65 unidades.
- Leitos são numéricos em 50 unidades; UPAEs usam `-` na fonte.
- O valor `Especializado` em `Tipo Gestão` para o Hemope foi preservado, mas requer validação semântica pela área responsável.

As correções de município e GERES aplicadas por evidência do endereço ou fonte oficial estão listadas em `data/processed/data-quality.json`, com a linha original e o link de comprovação.
