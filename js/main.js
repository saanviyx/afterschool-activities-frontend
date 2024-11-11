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
    cartTotal() {
      return this.cart.reduce((total, item) => total + item.price, 0);
    },
    cartItemCount() {
      return this.cart.length;
    },
    canCheckout() {
      return this.validateName() && this.validatePhone() && this.cart.length > 0;
    },
    filteredLessons() {
      const primitiveSearch = (query, text) => {
        query = query.toLowerCase();
        text = text.toLowerCase();
        for (let i = 0; i <= text.length - query.length; i++) {
          if (text.substring(i, i + query.length) === query) {
            return true;
          }
        }
        return false;
      };

      const filtered = [];
      for (let i = 0; i < this.lessons.length; i++) {
        const lesson = this.lessons[i];
        if (
          primitiveSearch(this.searchQuery, lesson.title) ||
          primitiveSearch(this.searchQuery, lesson.location) ||
          primitiveSearch(this.searchQuery, lesson.price.toString()) ||
          primitiveSearch(this.searchQuery, lesson.spaces.toString())
        ) {
          filtered.push(lesson);
        }
      }

      if (this.sortKey && this.sortOrder) {
        for (let i = 0; i < filtered.length; i++) {
          for (let j = i + 1; j < filtered.length; j++) {
            let swap = false;
            if (this.sortOrder === 'asc' && filtered[i][this.sortKey] > filtered[j][this.sortKey]) {
              swap = true;
            } else if (this.sortOrder === 'desc' && filtered[i][this.sortKey] < filtered[j][this.sortKey]) {
              swap = true;
            }
            if (swap) {
              const temp = filtered[i];
              filtered[i] = filtered[j];
              filtered[j] = temp;
            }
          }
        }
      }
      return filtered;
    },
  },
  methods: {
    async loadLessons() {
      try {
        const response = await fetch("/data");
        this.lessons = await response.json();
      } catch (error) {
        console.error("Error loading lessons:", error);
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
    submitOrder() {
      this.showModal = true;
      this.cart = [];
      this.name = "";
      this.phone = "";
      this.isCartPage = !this.isCartPage;
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
