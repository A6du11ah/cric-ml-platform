import firebaseConfigPromise from './firebase-config.js';

firebaseConfigPromise.then(() => {
    const database = firebase.database();
    const storage = firebase.storage();

    // Fetch and display users
    async function loadUsers() {
        try {
            const response = await fetch('/api/users/getAll');
            const users = await response.json();

            const usersTableBody = document.getElementById('users-table').querySelector('tbody');
            usersTableBody.innerHTML = '';

            users.forEach(user => {
                const row = document.createElement('tr');
                const userNameCell = document.createElement('td');
                const dateJoinedCell = document.createElement('td');
                const statusCell = document.createElement('td');
                const statusButton = document.createElement('button');

                userNameCell.textContent = user.user_name;
                dateJoinedCell.textContent = new Date(user.member_since).toLocaleDateString();
                statusButton.textContent = user.is_banned ? 'Banned' : 'Active';
                statusButton.onclick = () => toggleUserStatus(user.user_id, !user.is_banned);

                statusCell.appendChild(statusButton);
                row.appendChild(userNameCell);
                row.appendChild(dateJoinedCell);
                row.appendChild(statusCell);
                usersTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Fetch and display videos
    async function loadVideos() {
        try {
            const response = await fetch('/api/videos/getAll');
            const videos = await response.json();

            const videosTableBody = document.getElementById('videos-table').querySelector('tbody');
            videosTableBody.innerHTML = '';

            videos.forEach(video => {
                const row = document.createElement('tr');
                const titleCell = document.createElement('td');
                const visibilityCell = document.createElement('td');
                const dateUploadedCell = document.createElement('td');
                const playCell = document.createElement('td');
                const deleteCell = document.createElement('td');
                const playButton = document.createElement('button');
                const deleteButton = document.createElement('button');

                titleCell.textContent = `${video.video_title} (${video.user_name})`;
                visibilityCell.textContent = video.ispublic ? 'Public' : 'Private';
                dateUploadedCell.textContent = new Date(video.creation_date).toLocaleDateString();
                playButton.textContent = 'Play';
                playButton.onclick = () => playVideo(video.video_file_ref);
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => deleteVideo(video.video_id, video.video_file_name, video.user_id);

                playCell.appendChild(playButton);
                deleteCell.appendChild(deleteButton);
                row.appendChild(titleCell);
                row.appendChild(visibilityCell);
                row.appendChild(dateUploadedCell);
                row.appendChild(playCell);
                row.appendChild(deleteCell);
                videosTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading videos:', error);
        }
    }

    function toggleUserStatus(userId, isBanned) {
        fetch('/api/users/updateStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, isBanned })
        }).then(response => {
            if (response.ok) {
                loadUsers();
            } else {
                throw new Error('Failed to update user status');
            }
        }).catch(error => {
            console.error('Error updating user status:', error);
        });
    }

    function playVideo(videoRef) {
        // Implement the logic to play the video
        console.log('Playing video:', videoRef);
    }

    function deleteVideo(videoId, videoName, userId) {
        const storageRef = storage.ref();
        const videoRef = storageRef.child(`videos/${userId}/${videoName}`);

        videoRef.delete().then(async () => {
            fetch('/api/videos/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoId })
            }).then(response => {
                if (response.ok) {
                    loadVideos();
                } else {
                    throw new Error('Failed to delete video');
                }
            })
        }).catch((error) => {
            console.error('Error deleting video:', error);
        });
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadUsers();
            loadVideos();
        } else {
            window.location.href = 'http://localhost:3000/login'; 
        }
    });
}).catch(error => {
    console.error('Failed to initialize Firebase:', error);
});
