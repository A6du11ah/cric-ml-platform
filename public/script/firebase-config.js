// firebase-config.js

const firebaseConfigPromise = fetch('/api/env')
    .then(response => response.json())
    .then(config => {
        const firebaseConfig = {
            apiKey: config.API_KEY,
            authDomain: config.AUTH_DOMAIN,
            databaseURL: config.DATABASE_URL,
            projectId: config.PROJECT_ID,
            storageBucket: config.STORAGE_BUCKET,
            messagingSenderId: config.MESSAGING_SENDER_ID,
            appId: config.APP_ID,
            measurementId: config.MEASUREMENT_ID
        };
        // Initialize Firebase
        return firebase.initializeApp(firebaseConfig);
    })
    .catch(error => {
        console.error('Error fetching environment variables:', error);
        throw error;
    });

export default firebaseConfigPromise;
