# GraveCare

### Жоба туралы

GraveCare — бұл Қазақстандағы мұсылмандар үшін әлеуметтік маңызы бар жоба. Ол бір зиратқа жерленген туыстарды біріктіруге көмектеседі. Жобаның мақсаты — әрбір зират үшін жабық Telegram топтарын құру арқылы туыстарға келесі мүмкіндіктерді беру:
* Алдағы сенбіліктер туралы жаңалықтар мен хабарландырулар алу.
* Бірге жиналып, мұсылман зираттарын таза және ретті ұстау.

Қазіргі уақытта жоба тек Алматы қаласында жұмыс істейді.

### Жобаның жағдайы мен функционалы

Жоба әзірлеудің бастапқы кезеңінде және келесі функцияларға ие:

#### 1. Пайдаланушының жеке кабинеті
* Google арқылы тіркелу және кіру (Firebase қолданылады).
* Пайдаланушы профилінде іздеу тарихы, туыстықты растау мәртебесі және Google аккаунтынан алынған деректер көрсетіледі.

#### 2. Зираттарды қарау және туыстықты растау
* **"Могилы"** (Зираттар) бетінде дерекқорға қосылған барлық зираттардың тізімі көрсетіледі.
* Әрбір зиратта атауы, толық мекенжайы, қаласы, GPS-координаттары, интерактивті карта, бір фотосурет, жерленгендер тізімі (Аты-жөні) және 2ГИС сілтемесі бар.
* **Басты ерекшелігі:** Кем дегенде бір жерленген адаммен туыстығы расталғаннан кейін, пайдаланушыға сол зират үшін арнайы жабық Telegram тобына кіруге арналған **QR-код** пен тікелей сілтеме қолжетімді болады. Бұл жобаның негізгі функциясы болып табылады.

#### 3. Іздеу
* Басты бетте Аты-жөні немесе қала бойынша жерленген адамдарды іздеу модулі бар.
* **"Подробнее"** (Толығырақ) батырмасын басқанда, жерленген адам туралы толық ақпарат (Аты-жөні, қала, мекенжай) және интерактивті картасы бар модальді терезе ашылады.
* Егер туыстық әлі расталмаған болса, **"Я Родственник"** (Мен туысымын) батырмасы көрсетіледі. Оны басқанда, тексеруге өтінім жіберу формасы ашылады. Формада аты-жөнін, туыстық мәртебесін көрсетіп, растайтын құжатты PDF форматында жүктеу керек.

#### 4. Әкімшілік панелі
* Әкімшілік панелі пайдаланушылардың туыстықты растау туралы өтінімдерін тексеруге және зираттар дерекқорын қолмен басқаруға арналған.
* **"Заявки"** (Өтінімдер) қойындысында пайдаланушылардың барлық өтінімдері көрсетіледі.
* **"Могилы"** (Зираттар) қойындысында зираттарды қосу, өңдеу немесе жою мүмкіндігі бар. Жаңа зират қосу үшін келесі өрістер толтырылады:
    * **Атауы**, **Қаласы**, **Мекенжайы**, **Координаттары**.
    * **Фото**: бір сурет жүктеу.
    * **Telegram**: жабық топқа сілтеме, ол автоматты түрде QR-код жасайды.
    * **2GIS**: зираттың мекенжайына тікелей сілтеме.
    * **Зираттың рейтингі**: қазіргі уақытта рейтинг қолмен (1-ден 5-ке дейін) қойылады, болашақта 2ГИС API арқылы рейтингті алу жоспарланған.

---

### Технологиялар

* **Бэкенд:** Golang
* **Фронтенд:** React.js, Vite, Tailwind CSS
* **Дерекқор:** PostgreSQL (басқару pgAdmin 4 арқылы)
* **Авторизация:** Firebase
* **Қосымша құралдар:** Бұл жоба Grok AI көмегімен жасалған.

### Жобаны орнату және іске қосу

Жобаны жергілікті жерде іске қосу үшін келесі нұсқауларды орындаңыз:

1.  Репозиторийді клондаңыз:
    `git clone https://github.com/salauatamet/GraveCare.git`

2.  **Бэкендті іске қосу:**
    * Бэкенд қалтасына өтіңіз: `cd GraveCare/backend`
    * Серверді іске қосыңыз: `go run main.go`

3.  **Фронтендті іске қосу:**
    * Жаңа терминал ашыңыз.
    * Фронтенд қалтасына өтіңіз: `cd GraveCare/frontend`
    * Клиенттік қосымшаны іске қосыңыз: `npm run dev`

---

### Авторлық

* Жобаның идеясы мен негізі: **SalauatDiiN Ametov**.
__________________________________

# GraveCare

### About the Project

GraveCare is a socially significant project for Muslims in Kazakhstan that helps to gather communities of relatives buried in the same Muslim graves. The project's goal is to create closed Telegram groups for each burial site, allowing relatives to:
* Receive news and notifications about upcoming clean-up days (subbotniks).
* Gather concerned family members to maintain the cleanliness and order of Muslim graves.

Currently, the project operates only in Almaty.

### Project Status and Features

The project is in its initial development stage and already has the following functionality:

#### 1. User Account
* Registration and authentication via Google (using Firebase).
* The user profile displays search history, kinship confirmation status, and user data from their Google account.

#### 2. Viewing Graves and Kinship Confirmation
* The **"Graves"** page shows a list of all burial sites added to the database.
* Each grave includes: name, full address, city, GPS coordinates, an interactive map, one photo, a list of the deceased (full name), and a 2GIS link.
* **Key Feature:** After confirming kinship with at least one buried person, the user gets access to a **QR code** and a direct link to the closed Telegram group for that specific grave. This functionality is the main feature of the project.

#### 3. Search
* The main page has a search module to find the deceased by full name or city.
* Clicking **"Details"** opens a modal window with detailed information about the deceased (full name, city, address) and an interactive map.
* If kinship has not been confirmed yet, a **"I'm a Relative"** button is displayed. Clicking it opens a form to submit a request for moderation. In the form, the user must provide their name, kinship status, and upload a supporting document in PDF format.

#### 4. Admin Panel
* The admin panel is designed for moderating user requests for kinship confirmation and manually managing the database of graves.
* **"Requests" tab**: Allows viewing and managing all user requests.
* **"Graves" tab**: Provides the ability to add, edit, or delete grave information. To add a new grave, the following fields must be filled:
    * **Name**, **City**, **Address**, **Coordinates**.
    * **Photo**: Upload one photo.
    * **Telegram**: A link to the closed group, which automatically generates a QR code.
    * **2GIS**: A direct link to the grave's address on 2GIS.
    * **Grave Rating**: Currently, the rating is set manually (1 to 5), with future plans to integrate with the 2GIS API to pull ratings.

---

### Technologies

* **Backend:** Golang
* **Frontend:** React.js, Vite, Tailwind CSS
* **Database:** PostgreSQL (managed with pgAdmin 4)
* **Authentication:** Firebase
* **Tools:** This project was developed with the help of Grok AI.

### Installation and Running the Project

To set up and run the project locally, follow these instructions:

1.  Clone the repository:
    `git clone https://github.com/salauatamet/GraveCare.git`

2.  **Running the Backend:**
    * Navigate to the backend folder: `cd GraveCare/backend`
    * Start the server: `go run main.go`

3.  **Running the Frontend:**
    * Open a new terminal.
    * Navigate to the frontend folder: `cd GraveCare/frontend`
    * Start the client application: `npm run dev`

---

### Authorship

* Project idea and foundation: **SalauatDiiN Ametov**.
__________________________________

# GraveCare

### О проекте

GraveCare — это социально значимый проект для мусульман в Казахстане, который помогает объединять сообщества родственников, похороненных в одних могилах. Цель проекта — создать закрытые Telegram-группы для каждого места захоронения, где родственники смогут:
* Получать новости и уведомления о предстоящих субботниках.
* Собирать неравнодушных близких для поддержания чистоты и порядка на мусульманских могилах.

На текущий момент проект работает только по городу Алматы.

### Статус и функционал проекта

Проект находится на начальной стадии разработки и уже обладает следующим функционалом:

#### 1. Личный кабинет пользователя
* Регистрация и авторизация через Google (с использованием Firebase).
* В профиле пользователя отображаются: история поиска, статус подтверждения родства и данные, полученные из аккаунта Google.

#### 2. Просмотр могил и подтверждение родства
* На странице **"Могилы"** отображается список всех захоронений, добавленных в базу данных.
* Каждая могила содержит: название, полный адрес, город, GPS-координаты, интерактивную карту, одно фото, список захороненных (ФИО) и ссылку на 2ГИС.
* **Ключевая особенность:** После подтверждения родства с хотя бы одним захороненным, пользователю становится доступен **QR-код** и прямая ссылка на закрытую Telegram-группу, предназначенную для этой конкретной могилы. Этот функционал является основной функцией проекта.

#### 3. Поиск
* На главной странице доступен модуль для поиска захороненных по ФИО или по городу.
* При нажатии на кнопку **"Подробнее"** открывается модальное окно с информацией о захороненном человеке (ФИО, город, адрес) и интерактивной картой.
* Если родство еще не подтверждено, отображается кнопка **"Я родственник"**. Нажатие на неё открывает форму для отправки заявки на модерацию. В форме необходимо указать имя, статус родства и прикрепить подтверждающий документ в формате PDF.

#### 4. Административная панель
* Админ-панель предназначена для модерации заявок на подтверждение родства и ручного управления базой данных могил.
* **Вкладка "Заявки"**: позволяет просматривать и управлять всеми заявками пользователей.
* **Вкладка "Могилы"**: дает возможность добавлять, редактировать или удалять информацию о захоронениях. При добавлении новой могилы заполняются следующие поля:
    * **Название**, **Город**, **Адрес**, **Координаты**.
    * **Фото**: загрузка одного изображения.
    * **Telegram**: ссылка на закрытую группу, которая автоматически генерирует QR-код.
    * **2GIS**: прямая ссылка на адрес в 2ГИС.
    * **Рейтинг могилы**: на данном этапе рейтинг выставляется вручную (от 1 до 5), в дальнейшем планируется интеграция с API 2ГИС.

---

### Технологии

* **Бэкенд:** Golang
* **Фронтенд:** React.js, Vite, Tailwind CSS
* **База данных:** PostgreSQL (управление через pgAdmin 4)
* **Авторизация:** Firebase
* **Вспомогательные инструменты:** Данный проект был сделан с помощью ИИ Grok.

### Установка и запуск проекта

Чтобы запустить проект локально, следуйте этим инструкциям:

1.  Клонируйте репозиторий:
    `git clone https://github.com/salauatamet/GraveCare.git`

2.  **Запуск бэкенда:**
    * Перейдите в папку бэкенда: `cd GraveCare/backend`
    * Запустите сервер: `go run main.go`

3.  **Запуск фронтенда:**
    * Откройте новый терминал.
    * Перейдите в папку фронтенда: `cd GraveCare/frontend`
    * Запустите клиентское приложение: `npm run dev`

---

### Авторство

* Идея и основа проекта: **SalauatDiiN Ametov**.