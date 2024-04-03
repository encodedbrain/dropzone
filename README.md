
# API para Upload e Download de Arquivos - NestJS, Prisma e PostgreSQL

Visão Geral
Este projeto tem como objetivo fornecer uma API robusta e eficiente para facilitar o upload e download de arquivos de forma rápida e fácil. Utiliza tecnologias modernas como NestJS, Prisma e PostgreSQL para garantir alta performance e escalabilidade. A API está em constante desenvolvimento para oferecer uma solução versátil para diferentes tipos de aplicativos que necessitam dessa funcionalidade.


## Funcionalidades

**Upload de Arquivos:**  Permite que os usuários façam upload de arquivos de maneira rápida e eficiente.
**Download de Arquivos:**  Possibilita o download dos arquivos previamente carregados na plataforma.


## Instalação

Instruções para Desenvolvedores

**Clone o repositório:**
bash
Copy code
``` bash
git clone https://github.com/seu-usuario/upload-file-api.git
```
**Instale as dependências:**

bash
copie o código

``` bash
cd upload-file-api
npm install
```
**Configure o banco de dados:**

Configure as variáveis de ambiente no arquivo .env com as credenciais do seu banco de dados PostgreSQL.
Execute as migrações do banco de dados usando 
**Prisma:**
bash
Copie o código

```bash
npx prisma migrate dev
```
**Execute o servidor de desenvolvimento:**

bash
copie o código 
```bash
npm run start:dev
```
## Variáveis de Ambiente

Para rodar esse projeto, você vai precisar adicionar as seguintes variáveis de ambiente no seu .env


`DATABASE_URL`


## Stack utilizada

**Back-end:** NestJS
Prisma
PostgreSQL


## Documentação da API

```Postgres Table```

| Parâmetro   | Tipo       | Descrição                           |
| :---------- | :--------- | :---------------------------------- |
| `File` | `string` | nome do arquivo |
| `Date` | `string` | data do envio dd/mm/yyyy |
| `Time` | `string` | horário do envio hh/mm/ss |
| `Size` | `int` | tamanho do arquivo |


#### enviando arquivo

```http
  POST /upload/file
```

| Parâmetro   | Tipo       | Descrição                           |
| :---------- | :--------- | :---------------------------------- |
| `File` | `formData` | file |

#### Retorna um item

```http
  GET /upload/${id}
```

| Parâmetro   | Tipo       | Descrição                                   |
| :---------- | :--------- | :------------------------------------------ |
| `name`      | `string` | nome do arquivo |

#### deleta um item

```http
  DELETE /upload/delete
```

| Parâmetro   | Tipo       | Descrição                                   |
| :---------- | :--------- | :------------------------------------------ |
| `id`      | `integer` | id do arquivo |
| `name`      | `string` | nome do arquivo |


## Contribuindo

**Contribua:** Sinta-se à vontade para contribuir com correções de bugs, melhorias no código ou sugestões para novos recursos. Todas as formas de contribuição são bem-vindas!
**Contato**
Para qualquer dúvida, sugestão ou problema relacionado a este projeto, entre em contato através do meu email 
[marcodamasceno](mailto:marcodamasceno0101@outlook.com)
 ou abra uma issue no GitHub.

Agradeço o seu interesse em contribuir para tornar este projeto ainda melhor!
