from pydantic import BaseModel
from typing import Optional, List

# 1. Estrutura do Documento (Espelho do React)
class DocumentState(BaseModel):
    titulo: str = ""
    areaSolicitante: str = ""
    responsavel: str = ""
    dataSolicitacao: str = ""
    sistemaImpactado: str = ""
    
    # Seção 2
    cenarioAtual: str = ""
    necessidadeNegocio: str = ""
    beneficiosEsperados: str = ""
    expectativaFuncional: str = ""

# 2. O que o Front manda para o Back (Input)
class ChatRequest(BaseModel):
    message: str
    current_doc: DocumentState  # O estado atual do documento
    conversation_history: List[dict] = [] # Histórico para a IA ter memória

# 3. O que o Back devolve para o Front (Output)
class ChatResponse(BaseModel):
    ai_message: str
    updated_doc: DocumentState
    next_field_to_ask: Optional[str] = None