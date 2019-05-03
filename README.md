# Elliott-Neely Analysis APP

Necessário para Executar:
1. Node.js (disponível em: https://nodejs.org/ para Linux/MacOS/Windows)

Passos para Executar:
1. Clonar o repositório para uma pasta.
2. Abrir o caminho da pasta no prompt de comando.
3. Instalar o projeto (necessário somente na primeira vez)
	- npm install
4. Executar o comando de inicialização do projeto
	- npm start

Em caso de erro no Passo 3:
1. Limpar o cache do NPM
	- npm cache clean
2. Tentar instalar novamente
3. Caso o erro persistir, realizar a limpeza forçada
	- npm cache clean --force

Em caso de erro no Passo 4 após já ter conseguido executar o programa antes:
1. Deletar a pasta node_modules
2. Limpar o cache do NPM
	- npm cache clean
3. Instalar o Projeto novamente
	- npm install
4. Iniciar o projeto
	- npm start
