// Initialize the Vue instance
let app = new Vue({
  el: "#app", // Bind Vue instance to the HTML element with id "app"
  
  // Data properties to store application state
  data: {
    lessons: [], // Array to store lesson data fetched from the server
    cart: [], // Array to store lessons added to the cart
    isCartPage: false, // Boolean to toggle between cart and lessons view
    sortKey: "", // Key used for sorting lessons
    sortOrder: "", // Order used for sorting (asc or desc)
    name: "", // User's name for order submission
    phone: "", // User's phone number for order submission
    searchQuery: "", // Query string for searching lessons
    showModal: false, // Boolean to control visibility of the modal
  },

  // Computed properties for derived data
  computed: {
    // Filter lessons based on sortKey and sortOrder
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
    // Calculate the total price of items in the cart
    cartTotal() {
      return this.cart.reduce((total, item) => total + item.price, 0);
    },
    // Count the number of items in the cart
    cartItemCount() {
      return this.cart.length;
    },
    // Check if checkout is allowed
    canCheckout() {
      return this.validateName() && this.validatePhone() && this.cart.length > 0;
    },
  },

  // Methods to define behavior
  methods: {
    // Search for lessons based on the search query
    searchLessons() {
      if (this.searchQuery === "") {
        this.loadLessons(); // Load all lessons if query is empty
      } else {
        this.fetchSearchResults(this.searchQuery); // Fetch lessons matching the query
      }
    },

    // Fetch all lessons from the server
    async loadLessons() {
      try {
        const response = await fetch("https://afterschool-activities-backend.onrender.com/data", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();

        // Adjust lessons based on cart contents
        this.lessons = data.map((lesson) => {
          let adjustedLesson = { ...lesson };
          for (let i = 0; i < this.cart.length; i++) {
            if (this.cart[i].id === adjustedLesson.id) {
              adjustedLesson.spaces -= 1; // Reduce available spaces if lesson is in cart
            }
          }
          return adjustedLesson;
        });
      } catch (error) {
        console.error("Error loading lessons:", error);
      }
    },

    // Fetch lessons matching the search query
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
        const backendLessons = await response.json();

        // Adjust lessons based on cart contents
        const adjustedLessons = [];
        for (let i = 0; i < backendLessons.length; i++) {
          const lesson = backendLessons[i];
          let cartCount = 0;
          for (let j = 0; j < this.cart.length; j++) {
            if (this.cart[j].id === lesson.id) {
              cartCount++;
            }
          }
          adjustedLessons.push({
            ...lesson,
            spaces: lesson.spaces - cartCount,
          });
        }
        this.lessons = adjustedLessons;
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    },    

    // Submit the order
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
        name: this.name, // User's name
        phone: this.phone, // User's phone number
        lessons, // Ordered lessons
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

        // Update lessons after order submission
        for (let lesson of lessons) {
          const lessonInCart = this.cart.find((item) => item.id === lesson.lessonId);
          if (lessonInCart) {
            await this.updateLesson(lesson.lessonId, {
              spaces: lessonInCart.spaces - lesson.quantity,
            });
          }
        }

        this.showModal = true; // Show confirmation modal
        this.cart = []; // Clear cart
        this.name = ''; // Clear name
        this.phone = ''; // Clear phone
        this.isCartPage = false; // Reset to lessons page
      } catch (error) {
        console.error('Error submitting order:', error);
      }
    },  

    // Add a lesson to the cart
    async addToCart(lesson) {
      if (lesson.spaces > 0) {
        this.cart.push({ ...lesson }); // Add lesson to cart
        lesson.spaces--; // Decrease available spaces
      }
    },

    // Remove a lesson from the cart
    async removeFromCart(item) {
      let found = false;
      const updatedCart = [];
      
      // Rebuild cart without the removed item
      for (let i = 0; i < this.cart.length; i++) {
        if (!found && this.cart[i].id === item.id) {
          found = true;
        } else {
          updatedCart.push(this.cart[i]);
        }
      }
      this.cart = updatedCart;
    
      // Increase spaces for the removed lesson
      for (let i = 0; i < this.lessons.length; i++) {
        if (this.lessons[i].id === item.id) {
          this.lessons[i].spaces++;
          break;
        }
      }
    },    

    // Update a lesson on the server
    async updateLesson(lessonId, updateFields) {
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

    // Toggle between cart and lessons page
    toggleCartPage() {
      if (this.cart.length > 0 || this.isCartPage) {
        this.isCartPage = !this.isCartPage;
      }
    },

    // Validate the user's name
    validateName() {
      const namePattern = /^[A-Za-z\s]+$/;
      return namePattern.test(this.name);
    },

    // Validate the user's phone number
    validatePhone() {
      const phonePattern = /^[0-9]{10}$/;
      return phonePattern.test(this.phone);
    },

    // Close the modal
    closeModal() {
      this.showModal = false;
    },

    // Toggle the theme between light and dark
    toggleTheme() {
      document.body.classList.toggle("dark-theme");
    },

    // Generate star ratings
    getStars(rating) {
      const fullStars = Math.floor(rating); // Full stars
      const halfStar = rating % 1 >= 0.5; // Half star if rating has a fractional part
      const stars = [];

      // Add full stars
      for (let i = 0; i < fullStars; i++) {
        stars.push('<i class="fas fa-star"></i>');
      }

      // Add half star if applicable
      if (halfStar) {
        stars.push('<i class="fas fa-star-half-alt"></i>');
      }

      // Add remaining empty stars to make total 5
      while (stars.length < 5) {
        stars.push('<i class="far fa-star"></i>');
      }
      return stars.join(" ");
    },
  },

  // Hook called when Vue instance is mounted
  mounted() {
    this.loadLessons(); // Load lessons on initialization
  },
});
