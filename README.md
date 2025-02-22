# Afilia

Afilia est une application mobile développée avec React Native et Expo, conçue pour recenser les événements culturels et de divertissement près de chez vous. Que vous souhaitiez assister à un concert, une pièce de théâtre, visiter un musée ou découvrir une exposition, Afilia vous permet de parcourir l’agenda culturel local et de réserver vos places en quelques clics.

## Fonctionnalités

- **Recherche d'événements culturels** : Parcourez une sélection d’événements (concerts, théâtres, musées, expositions, etc.) organisés dans votre région.
- **Création d'événements** : Réservez facilement vos places pour les sorties qui vous intéressent.
- **Messagerie intégrée** : Consultez les informations clés (lieu, date, nombre de places disponibles, etc.) pour chaque événement.
- **Interface conviviale** : Profitez d’une expérience utilisateur fluide et moderne pour ne rien manquer de l’actualité culturelle.

## Technologies utilisées

- **React Native** : Framework pour le développement d'applications mobiles multiplateformes.
- **Expo** : Outil et service pour accélérer le développement et le déploiement de l'application.
- **Node.js et npm** : Gestion des dépendances et exécution des scripts de développement.

## Installation et lancement du projet

1.  **Clonez le dépôt**<br><br>

    Clonez ce dépôt sur votre machine locale :

    ```bash
    git clone https://github.com/aminemn14/Afilia.git
    cd afilia
    ```

    <br><br>

2.  **Installation des dépendances**<br>
    Installez les dépendances du projet en utilisant npm :

    ```bash
    npm install
    cd backend
    npm install
    cd ..
    ```

    <br><br>

3.  **Démarrage de l’application**<br>
    Pour lancer l’application en mode développement, suivez ces étapes :
    <br>

    1. Configuration du backend :
       <br>

    ```bash
    cd backend
    ```

     <br>
     • Créez un fichier .env à la racine du dossier backend et remplissez-le avec les variables suivantes :
     <br><br>

    ```bash
    MONGO_URI= # URL de connexion à votre base de données MongoDB
    PORT= # Port sur lequel le serveur backend sera lancé (ex: 5000)
    ```

    <br> 2. Lancer le serveur backend :
    <br>

    ```bash
    npm run dev
    ```

     <br>
     3. Configuration du backend :
     <br><br>
     Avant de lancer l’application mobile Expo, créez un fichier .env à la racine du projet (au même niveau que app.config.js) et remplissez-le avec les variables suivantes :
     <br><br>

    ```bash
    SUPABASE_URL= # URL de votre projet Supabase
    SUPABASE_ANON_KEY= # Clé anonyme pour accéder à Supabase

    API_BASE_URL= # URL de votre API backend
    ```

     <br>
     Pour API_BASE_URL :
     <br><br>
     • Vous pouvez utiliser l’URL locale de votre backend si vous testez sur un émulateur Android avec 10.0.2.2:<PORT> (exemple : http://10.0.2.2:5000).
     • OU utiliser Ngrok pour rendre l’API accessible sur un appareil physique. Pour ce faire, lancez la commande suivante depuis le dossier backend :
     <br><br>

    ```bash
    ngrok http 8070
    ```

     <br>
     Prenez l’URL HTTPS générée par Ngrok et mettez-la dans .env.
     <br><br>
     ⚠️ Remarque : Chaque fois que vous relancez Ngrok, une nouvelle URL est générée. N’oubliez pas de mettre à jour .env en conséquence.

    <br> 4. Lancer l'application mobile :
    <br>
    • Ouvrez un nouveau terminal sans fermer celui du backend.
    • Revenez au dossier racine du projet et lancez Expo :
    <br>

    ```bash
    cd ..
    npx expo start
    ```

    <br>
    Cette commande ouvrira la console Expo, où vous pourrez choisir de lancer l’application sur un émulateur ou sur votre appareil mobile via l’application Expo Go.
