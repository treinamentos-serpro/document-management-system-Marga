# Especificação - Document Management System

## 1. Objetivo

Entregar um sistema web simples para usuários enviarem, consultarem e baixarem documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Validação de usuário, arquivo, tamanho e tipo MIME.
- Listagem completa dos documentos conhecidos pelo processo.
- Download de um documento pelo identificador.
- Identificação simples do dono por meio do header `X-User-Id`.
- Interface React para upload, listagem e download.
- Tratamento padronizado de erros da API.

### Fora do escopo

- Armazenamento externo, em nuvem ou banco de dados.
- Persistência dos metadados após reinício do processo.
- Autenticação, sessão ou autorização real.
- Exclusão de documentos.
- Versionamento, histórico ou edição de documentos.
- Compartilhamento entre usuários.
- Busca, filtros, paginação ou ordenação configurável.
- Antivírus, OCR, conversão de formatos ou pré-visualização.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Uma requisição `POST /upload` válida grava o arquivo em `backend/storage` e retorna `201` com os metadados criados. |
| RF-02 | O upload exige identificação do usuário. | A API aceita `X-User-Id` não vazio e grava seu valor em `owner`; a ausência ou valor inválido retorna `400`. |
| RF-03 | O upload exige um arquivo. | O campo multipart `file` deve existir; caso contrário, a API retorna `400` sem registrar metadados. |
| RF-04 | O upload valida tamanho e tipo. | Arquivos acima de `MAX_FILE_SIZE` retornam `413`; MIME não permitido retorna `415`; o arquivo rejeitado não permanece disponível. |
| RF-05 | Cada documento possui identificador único. | O serviço gera um `id` seguro e não reutilizado durante o ciclo de vida do processo. |
| RF-06 | O sistema preserva o nome original com segurança. | `originalName` é retornado nos metadados e usado no download, sem permitir que o nome controle o caminho físico do arquivo. |
| RF-07 | O usuário pode listar documentos. | `GET /documents` retorna `200` com uma lista JSON contendo somente metadados, sem conteúdo binário. |
| RF-08 | A listagem representa o índice em memória. | A lista contém os documentos registrados desde a inicialização do processo; não há filtro por usuário no MVP. |
| RF-09 | O usuário pode baixar um documento. | `GET /documents/:id/download` retorna o conteúdo binário do arquivo e informa um `Content-Disposition` compatível com `originalName`. |
| RF-10 | A API informa falhas de forma consistente. | Erros retornam JSON no formato `{ "error": "CODIGO", "message": "Descrição" }`, com status HTTP apropriado. |
| RF-11 | A interface consome a API pelo prefixo `/api`. | O frontend usa `fetch` para upload, listagem e download; o proxy do Vite encaminha `/api` ao backend. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS, sem TypeScript. |
| RNF-02 | O frontend deve usar React, Vite, ESM e componentes funcionais com Hooks. |
| RNF-03 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-04 | Os metadados devem permanecer em memória nesta fase. Reiniciar o backend mantém os arquivos físicos, mas perde o índice de metadados. |
| RNF-05 | A configuração deve seguir 12-Factor, usando variáveis de ambiente para porta, diretório de storage, tamanho máximo e tipos MIME permitidos. |
| RNF-06 | O nome original nunca deve ser usado diretamente para formar o caminho físico, evitando colisões e traversal de diretórios. |
| RNF-07 | As camadas devem respeitar a dependência `routes -> controllers -> services -> repositories`; regras de negócio não devem depender de Express. |
| RNF-08 | Operações de arquivo devem tratar falhas de escrita, leitura e arquivo ausente sem expor stack trace ou caminhos internos ao cliente. |
| RNF-09 | Testes backend devem usar o runner nativo `node:test` e cobrir os fluxos de sucesso e falha dos endpoints. |
| RNF-10 | A API deve retornar `Content-Type` apropriado: JSON para metadados/erros e binário para downloads. |

## 5. Modelo de dados

### 5.1 Metadados do documento

O índice em memória deve armazenar um objeto `DocumentMetadata` por documento:

| Campo | Tipo | Obrigatório | Descrição e invariantes |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único usado nas rotas. Deve ser gerado pela aplicação e não derivado do nome original. |
| `originalName` | `string` | Sim | Nome informado pelo cliente, normalizado para apresentação e sem caminho de diretório. |
| `size` | `number` | Sim | Tamanho final do arquivo em bytes; deve ser maior ou igual a zero. |
| `uploadedAt` | `string` | Sim | Data/hora do upload em formato ISO 8601 UTC. |
| `owner` | `string` | Sim | Valor validado do header `X-User-Id`. Não representa autenticação real. |

O repositório também pode manter internamente o caminho físico associado ao `id`, mas esse caminho não deve ser exposto no JSON público. Os metadados são criados somente depois que o upload for aceito e gravado com sucesso.

### 5.2 Configuração

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `PORT` | Não | Porta HTTP; padrão do seed: `3000`. |
| `STORAGE_DIR` | Não | Diretório dos arquivos; padrão: `backend/storage`. |
| `MAX_FILE_SIZE` | Não | Limite máximo em bytes. O valor padrão deve ser definido na implementação. |
| `ALLOWED_MIME_TYPES` | Não | Lista configurável de MIME types separados por vírgula. Deve contemplar, no mínimo, PDF, DOC/DOCX, TXT e imagens quando usada a configuração padrão. |

## 6. Contratos de API

### 6.1 Convenção de erros

Toda falha controlada deve retornar:

```json
{
  "error": "CODIGO_DO_ERRO",
  "message": "Descrição legível para o cliente"
}
```

Os códigos devem ser estáveis e em maiúsculas, por exemplo `VALIDATION_ERROR`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `DOCUMENT_NOT_FOUND` e `INTERNAL_ERROR`. Falhas internas não devem retornar detalhes de filesystem.

### 6.2 `POST /upload`

**Finalidade:** criar um documento.

**Headers:**

- `X-User-Id`: obrigatório, string não vazia.
- `Content-Type`: `multipart/form-data`.

**Corpo:** campo multipart obrigatório `file`, contendo um único arquivo.

**Regras:**

- O arquivo deve respeitar `MAX_FILE_SIZE`.
- O MIME deve estar em `ALLOWED_MIME_TYPES`.
- O arquivo deve ser gravado via `multer.diskStorage` dentro de `STORAGE_DIR`.
- O nome físico deve ser controlado pela aplicação.
- O registro de metadados só deve ser criado após a gravação bem-sucedida.

**Sucesso `201 Created`:**

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "usuario-123"
}
```

**Erros:**

| Status | Situação |
| --- | --- |
| `400` | Header ausente/vazio, campo `file` ausente ou multipart inválido. |
| `413` | Arquivo excede `MAX_FILE_SIZE`. |
| `415` | MIME não permitido. |
| `500` | Falha inesperada ao gravar o arquivo ou registrar metadados. |

### 6.3 `GET /documents`

**Finalidade:** listar os documentos conhecidos pelo processo.

**Sucesso `200 OK`:** array de `DocumentMetadata`, sem caminhos físicos e sem conteúdo dos arquivos.

```json
[
  {
    "id": "document-id",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": "usuario-123"
  }
]
```

A resposta inclui todos os registros em memória, independentemente de `owner`. Não há paginação, filtro ou autenticação nesta fase.

**Erro `500 Internal Server Error`:** falha inesperada ao consultar o repositório, no formato padronizado de erro.

### 6.4 `GET /documents/:id/download`

**Finalidade:** entregar o conteúdo binário de um documento.

**Parâmetros:**

- `id`: identificador retornado pelo upload e pela listagem.

**Sucesso `200 OK`:**

- Corpo binário do arquivo.
- `Content-Type` compatível com o arquivo armazenado, quando disponível.
- `Content-Disposition: attachment; filename="<originalName>"`.

O nome no header deve ser tratado para impedir injeção de headers e não deve alterar o caminho físico usado na leitura.

**Erros:**

| Status | Situação |
| --- | --- |
| `404` | `id` não está no índice ou o arquivo físico não existe. |
| `500` | Falha inesperada na leitura do arquivo. |

### 6.5 `GET /health`

Endpoint existente de verificação do processo.

**Sucesso `200 OK`:**

```json
{
  "status": "ok"
}
```

Ele não faz parte do fluxo de documentos, mas deve permanecer disponível para verificação operacional.

## 7. Decisões arquiteturais

### 7.1 Backend

O backend deve seguir uma Clean Architecture simples:

```text
routes -> controllers -> services -> repositories
```

- `routes/`: registra endpoints, middleware do Multer e dependências dos controllers.
- `controllers/`: lê headers, parâmetros e multipart; valida entrada HTTP; converte resultados em respostas e status HTTP.
- `services/`: aplica regras de negócio, validações que não dependem de Express e coordena upload, listagem e download.
- `repositories/`: grava/lê arquivos locais e mantém o índice de metadados em memória.

As camadas internas não devem conhecer objetos de resposta do Express. O controller é o limite entre o protocolo HTTP e os casos de uso.

### 7.2 Armazenamento local

O Multer deve usar `diskStorage`. O destino deve ser `backend/storage` por padrão, ou `STORAGE_DIR` quando configurado. O arquivo físico deve receber um nome gerado internamente, relacionado ao `id`, para separar o nome de apresentação do caminho de armazenamento.

Não devem ser usados S3, bancos de dados, serviços externos, URLs públicas de arquivo ou provedores de upload.

### 7.3 Frontend

O frontend será composto por:

- `UploadComponent`: seleciona arquivo, envia `multipart/form-data` e informa estados de carregamento/erro.
- `DocumentList`: busca e exibe metadados.
- `DownloadButton`: solicita o download pelo identificador.
- `services/`: encapsula chamadas `fetch` para o prefixo `/api`.
- `pages/`: organiza a tela principal.

O usuário atual do MVP deve ser fornecido pela interface de forma simples e enviado como `X-User-Id`; isso não substitui autenticação.

### 7.4 Tratamento de ciclo de vida

Arquivos físicos podem sobreviver a um reinício, mas não haverá reconstrução automática do índice nesta fase. A implementação futura que precisar de recuperação após reinício deverá introduzir persistência ou uma estratégia explícita de reindexação.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura desta especificação. Nenhuma delas faz parte da criação deste documento.

1. **Fundação e configuração**
   - Organizar os módulos CommonJS nas camadas previstas.
   - Definir leitura de `PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE` e `ALLOWED_MIME_TYPES`.
   - Critério de aceite: aplicação inicia com defaults e configurações de ambiente sem alterar o contrato público.

2. **Repositório local**
   - Criar o diretório de storage quando necessário.
   - Configurar `multer.diskStorage` e o índice de metadados em memória.
   - Implementar associação segura entre `id` e caminho físico.
   - Critério de aceite: arquivo é gravado somente dentro do storage e pode ser recuperado pelo `id`.

3. **Serviços de negócio**
   - Implementar casos de uso de upload, listagem e download.
   - Validar owner, tamanho, MIME, identificador e consistência do registro.
   - Critério de aceite: serviços não dependem de Express e cobrem sucesso e falhas esperadas.

4. **Controllers e rotas**
   - Adicionar as três rotas de documentos e manter `/health`.
   - Mapear erros de domínio para status HTTP e JSON padronizado.
   - Critério de aceite: os contratos da seção 6 são atendidos integralmente.

5. **Testes backend**
   - Expandir os testes nativos do Node para upload, listagem, download e erros.
   - Isolar o storage de teste e remover arquivos temporários ao final.
   - Critério de aceite: casos felizes e rejeições de validação passam sem depender de serviços externos.

6. **Interface React**
   - Implementar página e componentes de upload, listagem e download.
   - Exibir estados de carregamento, sucesso, lista vazia e erro.
   - Critério de aceite: usuário consegue completar o fluxo pela interface usando `/api`.

7. **Integração frontend/backend**
   - Usar o proxy do Vite para encaminhar `/api` ao backend.
   - Confirmar envio do `X-User-Id` e tratamento dos erros JSON.
   - Critério de aceite: frontend e backend funcionam juntos em desenvolvimento local.

8. **Validação final e documentação**
   - Executar testes backend e validações disponíveis.
   - Conferir que não há caminho de arquivo exposto, dependência externa de storage ou quebra da arquitetura.
   - Atualizar documentação operacional somente se necessário.
   - Critério de aceite: implementação atende esta especificação e mantém o escopo MVP.
