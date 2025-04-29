mikroservislerin .env dosyalarını alakalı mikroservislerin app dosya dizinlerine koyalım

1 - backend_microservices/auth_service/app
2 - backend_microservices/chat_service/app
3 - backend_microservices/course_service/app
4 - backend_microservices/filemanager_service/app
5 - backend_microservices/genai_service/app
6 - backend_microservices/user_service/app

sonrasında backend_microservices kısmına gelip alttaki komutu çalıştıralım:
`docker compose up --build`

alttaki hatayı alıyorsanız Ediz'e veya Efe'ye başvurunuz

```
/usr/bin/env: ‘bash\r’: No such file or directory
/usr/bin/env: use -[v]S to pass options in shebang lines
```