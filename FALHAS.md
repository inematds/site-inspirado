# FALHAS — site-inspirado

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 04/11/2026 | máquina travou de novo (18:32) gerando `historia3.jpg` no servidor local (0 bytes), mesmo com pesado.sh e ≥ 30 GB livres | `imagens.py` passa a gerar pelo Codex (padrão), salva em `.tmp` + verify antes de trocar; local só com `--motor local` | infra + prompt |
| 04/11/2026 | espera por "render rodando" nunca acabava: `pgrep -f` achava o próprio prompt da sessão | detector olha só o executável (`ps -eo args`, ffmpeg/node/python no início) | infra |
| 04/11/2026 | máquina travou (14:35) gerando imagem no servidor local junto com renders de outras sessões; `historia1.jpg` 0 bytes | geração só dentro do `pesado.sh`, uma por vez, ≥ 30 GB livres, vigia para < 20 GB | infra |
| 01/11/2026 | máquina travou (16:05) na 1ª imagem do piloto; `hero.jpg` e os `plano.json` com 0 bytes | trava de memória no `imagens.py` (espera 30 GB livres) | infra |
| 01/11/2026 | `estilo.py` sugeriu acento quase branco e fundo em tom médio | acento por croma; fundo entre as cores bem claras ou bem escuras | prompt |
