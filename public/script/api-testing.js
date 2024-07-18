document.getElementById('button1').addEventListener('click', function () {
    fetch('/api1')
        .then(response => response.text())
        .then(data => {
            console.log("API 1 is called");
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('button2').addEventListener('click', function () {
    fetch('/api2')
        .then(response => response.text())
        .then(data => {
            console.log("API 2 is called");
        })
        .catch(error => {
            console.error('Error:', error);
        });
});