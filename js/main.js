let app = new Vue({
  el: "#app",
  data: {
    lessons: [],
    cart: [],
    isCartPage: false,
    sortKey: "",
    sortOrder: "",
    name: "",
    phone: "",
    searchQuery: "",
    showModal: false,
  },
  computed: {
    filteredLessons() {
      let lessons = this.lessons;
      if (this.sortKey) {
        lessons = lessons.sort((a, b) => {
          if (this.sortOrder === 'asc') {
            return a[this.sortKey] > b[this.sortKey] ? 1 : -1;
          } else if (this.sortOrder === 'desc') {
            return a[this.sortKey] < b[this.sortKey] ? 1 : -1;
          }
        });
      }
      return lessons;
    },
    cartTotal() {
      return this.cart.reduce((total, item) => total + item.price, 0);
    },
    cartItemCount() {
      return this.cart.length;
    },
    canCheckout() {
      return this.validateName() && this.validatePhone() && this.cart.length > 0;
    },
  },
  methods: {
    searchLessons() {
      if (this.searchQuery.trim()) {
        this.fetchSearchResults(this.searchQuery);
      } else {
        this.loadLessons();
      }
    },
    async loadLessons() {
      try {
        const response = await fetch("https://afterschool-activities-backend.onrender.com/data", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        console.log(data);
        this.lessons = data;
      } catch (error) {
        console.error("Error loading lessons:", error);
      }
    },
    async fetchSearchResults(query) {
      try {
        const response = await fetch(`https://afterschool-activities-backend.onrender.com/search?query=${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.lessons = await response.json();
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    },    
    async submitOrder() {
      const lessonMap = this.cart.reduce((map, item) => {
        if (!map[item.id]) {
          map[item.id] = { lessonId: item.id, quantity: 0 };
        }
        map[item.id].quantity += 1;
        return map;
      }, {});
  
      const lessons = Object.values(lessonMap);
      const orderData = {
        name: this.name,
        phone: this.phone,
        lessons,
      };
  
      try {
        const response = await fetch('https://afterschool-activities-backend.onrender.com/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
  
        if (!response.ok) {
          throw new Error('Order submission failed');
        }

        for (let lesson of lessons) {
          const lessonInCart = this.cart.find((item) => item.id === lesson.lessonId);
          if (lessonInCart) {
              await this.updateLessonSpaces(lesson.lessonId, {
                  spaces: lessonInCart.spaces - lesson.quantity,
              });
          }
        }
  
        this.showModal = true;
        this.cart = [];
        this.name = '';
        this.phone = '';
        this.isCartPage = false;
        this.loadLessons();
      } catch (error) {
        console.error('Error submitting order:', error);
      }
    },  
    async addToCart(lesson) {
      if (lesson.spaces > 0) {
        this.cart.push({ ...lesson });
        lesson.spaces--;
  
        await this.updateLessonSpaces(lesson.id, { spaces: lesson.spaces });
      } else {
        alert('No spaces available for this lesson!');
      }
    },
    async removeFromCart(item) {
      const updatedCart = this.cart.filter((cartItem) => cartItem.id !== item.id);
      this.cart = updatedCart;
  
      for (let i = 0; i < this.lessons.length; i++) {
        if (this.lessons[i].id === item.id) {
          this.lessons[i].spaces++;
          
          await this.updateLessonSpaces(this.lessons[i].id, { spaces: this.lessons[i].spaces });
          break;
        }
      }
    },
    async updateLessonSpaces(lessonId, updateFields) {
      try {
        const response = await fetch(`https://afterschool-activities-backend.onrender.com/update/${lessonId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updateFields }),
        });
  
        if (!response.ok) {
          throw new Error(`Failed to update lesson ID ${lessonId}`);
        }
  
        console.log(`Lesson ID ${lessonId} updated successfully.`);
      } catch (error) {
        console.error('Error updating lesson spaces:', error);
      }
    },
    toggleCartPage() {
      if (this.cart.length > 0 || this.isCartPage) {
        this.isCartPage = !this.isCartPage;
      }
    },
    validateName() {
      const namePattern = /^[A-Za-z\s]+$/;
      return namePattern.test(this.name);
    },
    validatePhone() {
      const phonePattern = /^[0-9]{10}$/;
      return phonePattern.test(this.phone);
    },
    closeModal() {
      this.showModal = false;
    },
    toggleTheme() {
      document.body.classList.toggle("dark-theme");
    },
    getStars(rating) {
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const stars = [];

      for (let i = 0; i < fullStars; i++) {
        stars.push('<i class="fas fa-star"></i>');
      }

      if (halfStar) {
        stars.push('<i class="fas fa-star-half-alt"></i>');
      }

      while (stars.length < 5) {
        stars.push('<i class="far fa-star"></i>');
      }
      return stars.join(" ");
    },
  },
  mounted() {
    this.loadLessons();
  },
});
