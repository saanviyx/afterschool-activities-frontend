let lessons = [];

function loadLessons() {
    fetch('/data') 
        .then(response => response.json())
        .then(data => {
            lessons = data; 
            displayLessons(); 
        })
        .catch(error => console.error('Error loading lessons:', error));
}

function displayLessons() {
    const lessonContainer = document.getElementById('lessonList');
    lessonContainer.innerHTML = ''; 
    lessons.forEach(lesson => {
        const lessonElement = document.createElement('div');
        lessonElement.classList.add('lesson');
        lessonElement.innerHTML = `
            <h2>${lesson.title}</h2>
            <p>Location: ${lesson.location}</p>
            <p>Price: $${lesson.price}</p>
            <p>Availability: ${lesson.spaces}</p>
            <input type="button" value="Add to Cart" onclick="addToCart(${lesson.id})" ${lesson.spaces <= 0 ? 'disabled' : ''}/>
        `;
        lessonContainer.appendChild(lessonElement);
    });
}