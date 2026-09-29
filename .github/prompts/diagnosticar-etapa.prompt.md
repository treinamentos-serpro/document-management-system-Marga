---
description: "Diagnostica por que uma etapa de CI não executou ou não liberou a próxima etapa"
name: "Diagnosticar etapa de CI"
argument-hint: "nome ou número da etapa (ex. Passo 3)"
agent: "agent"
---

# Diagnosticar etapa do fluxo

Investigue por que a etapa `${input:etapa:nome ou número da etapa}` não executou, falhou ou não habilitou a próxima etapa neste repositório.

Examine os workflows relacionados em `.github/workflows` e, quando relevante, as instruções e os critérios da etapa em `.github/steps`.

Verifique, nesta ordem:

1. Se o workflow está habilitado e se o evento, a branch e os filtros `paths` correspondem ao push esperado.
2. Se os arquivos exigidos pelo validador existem e atendem aos critérios definidos no workflow.
3. Se as dependências entre jobs e as condições de execução permitem chegar ao job que publica a próxima etapa.
4. Se permissões, tokens ou comandos de ativação do próximo workflow podem impedir a conclusão.
5. As execuções recentes do GitHub Actions para confirmar se o workflow disparou e qual foi o resultado. Use `gh` somente se estiver disponível e autenticado; nunca exponha tokens ou outros segredos.

Separe fatos observados de hipóteses e identifique a causa raiz mais provável com evidências do código ou da execução. Não altere arquivos nem estado remoto durante o diagnóstico.

Responda em português, de forma concisa, com:

- **Resultado:** se o workflow não disparou, falhou ou concluiu sem liberar a próxima etapa.
- **Causa:** a condição exata que explica o comportamento, citando os arquivos relevantes.
- **Próximo passo:** a ação mínima para destravar o fluxo e, se necessário, uma melhoria opcional na automação.