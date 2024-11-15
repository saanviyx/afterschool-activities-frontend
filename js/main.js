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
  watch: {
    searchQuery(newQuery) {
      this.fetchSearchResults(newQuery);
    }
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
        const response = await fetch("/data");
        const data = await response.json();
        console.log(data);
        this.lessons = data;
      } catch (error) {
        console.error("Error loading lessons:", error);
      }
    },
    async fetchSearchResults(query) {
      try {
        const response = await fetch(`/search?query=${query}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.lessons = await response.json();
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    },    
    async submitOrder() {
      const lessonIds = this.cart.map(item => item.id);
      const orderData = {
        name: this.name,
        phone: this.phone,
        lessonIds: lessonIds,
      };
  
      try {
        const response = await fetch('/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
  
        if (!response.ok) {
          throw new Error('Order submission failed');
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
    addToCart(lesson) {
      this.cart.push({ ...lesson, cartId: Date.now() });
      lesson.spaces--;
    },
    removeFromCart(item) {
      this.cart = this.cart.filter(cartItem => cartItem.cartId !== item.cartId);
      const originalLesson = this.lessons.find(lesson => lesson.id === item.id);
      if (originalLesson) originalLesson.spaces++;
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
