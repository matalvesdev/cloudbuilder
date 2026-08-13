#!/bin/bash
# CloudBuilder — GEOs Setup Script
# Setup do GEOs para marketing e growth do CloudBuilder

set -e

echo "🚀 Configurando GEOs para CloudBuilder..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python 3.11+ primeiro."
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✅ Python $PYTHON_VERSION encontrado"

# Verificar se o diretório geos existe
if [ ! -d "geos" ]; then
    echo "📁 Clonando repositório GEOs..."
    git clone https://github.com/matalvesdev/geos.git /tmp/geos
    cp -r /tmp/geos/geos .
    cp -r /tmp/geos/workflows .
    cp -r /tmp/geos/examples .
fi

# Instalar GEOs
echo "📦 Instalando GEOs..."
cd geos
python3 -m pip install -e . --quiet

# Inicializar
echo "🔧 Inicializando GEOs..."
geos init --mode brownfield

# Migrar banco
echo "🗄️ Migrando banco de dados..."
geos db migrate

# Ingestar conhecimento
echo "📚 Ingestando conhecimento do CloudBuilder..."
geos knowledge ingest ../docs --source docs 2>/dev/null || echo "⚠️ Diretório docs não encontrado, pulando..."
geos knowledge ingest ../.doc --source .doc 2>/dev/null || echo "⚠️ Diretório .doc não encontrado, pulando..."
geos knowledge ingest . --source knowledge 2>/dev/null || echo "⚠️ Diretório knowledge não encontrado, pulando..."

# Verificar saúde
echo "🏥 Verificando saúde do GEOs..."
geos doctor

echo ""
echo "✅ GEOs configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Listar workflows: geos workflows list"
echo "  2. Executar content pipeline: geos workflows run cloudbuilder-content-pipeline"
echo "  3. Executar daily intelligence: geos workflows run cloudbuilder-daily-intelligence"
echo "  4. Verificar health: geos doctor"
echo ""
echo "📖 Documentação: .doc/marketing/geos-integration.md"
