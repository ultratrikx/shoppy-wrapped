# 🛍️ Shopping Wrapped

A beautiful, interactive **Shopping Wrapped** experience built as a Shopify Shop Mini. Just like Spotify Wrapped, but for your shopping journey!

## ✨ Features

### 📱 Stories-Style Experience

-   **10 Interactive Frames**: Welcome → Analysis → Total Spent → Orders → Favorite Shop → Top Product → Shopping Style → Year in Numbers → Personality → Share
-   **Touch Navigation**: Tap left/right sides to navigate between frames
-   **Progress Indicator**: Visual progress bar showing your position in the story
-   **Smooth Animations**: Engaging transitions and animations throughout

### 📊 Shopping Analytics

-   **Total Spending**: Annual spending with achievement badges
-   **Order Statistics**: Number of orders with personalized messages
-   **Favorite Shop**: Most frequently shopped store
-   **Top Products**: Most ordered items
-   **Shopping Personality**: AI-generated personality based on shopping patterns
-   **Shopping Streak**: Consecutive months with purchases

### 📸 Instagram Story Sharing

-   **HTML-to-Image Conversion**: Captures the final frame as a high-quality image
-   **Direct Instagram Integration**: Opens Instagram app automatically
-   **Cross-Platform Support**: Works on iOS, Android, and Desktop
-   **Fallback Options**: Multiple sharing methods ensure it always works

### 🎨 Design Features

-   **Mobile-First**: Optimized for touch interactions
-   **Gradient Backgrounds**: Each frame has unique, beautiful gradients
-   **Tailwind CSS v4**: Modern styling with animations
-   **Responsive**: Looks great on all screen sizes
-   **Accessibility**: Touch-friendly with clear visual feedback

## 🚀 Getting Started

### Prerequisites

-   Node.js 16+
-   npm or yarn
-   Shopify Shop Minis CLI

### Installation

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd shopping-wrapped
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start development server**

    ```bash
    npm start
    ```

4. **Open in Shop Minis**
   The app will be available through the Shop Minis development environment.

## 🛠️ Technologies Used

-   **React 18**: Modern React with hooks
-   **TypeScript**: Type-safe development
-   **Tailwind CSS v4**: Utility-first styling
-   **html2canvas**: HTML-to-image conversion for Instagram sharing
-   **@shopify/shop-minis-react**: Shopify Shop Minis SDK

## 📱 Shop Minis APIs Used

### User Data

-   `useCurrentUser`: Current user information
-   `useOrders`: Order history and purchase data
-   `useSavedProducts`: Wishlist and saved items
-   `useRecentProducts`: Recently viewed products
-   `useFollowedShops`: Shops the user follows

### Sharing

-   `useShare`: Native sharing capabilities

## 🎯 Key Components

### Story Frames

Each frame provides unique insights:

-   **Welcome**: Introduction and start button
-   **Analyzing**: Progress animation with loading state
-   **Total Spent**: Annual spending with money emojis
-   **Orders Count**: Number of orders with achievement levels
-   **Favorite Shop**: Most visited store
-   **Top Product**: Most ordered item
-   **Shopping Style**: Personalized shopping personality
-   **Year in Numbers**: Key statistics grid
-   **Personality**: AI-generated shopping persona
-   **Share**: Instagram sharing with image capture

### Instagram Sharing Flow

1. **Capture**: Uses html2canvas to convert the share frame to image
2. **Process**: Creates high-quality PNG with proper dimensions
3. **Share**: Attempts multiple sharing methods:
    - Web Share API (modern browsers)
    - Direct Instagram app launch
    - Download + manual sharing
    - Fallback text sharing

## 🎨 Customization

### Colors

Each frame uses unique gradient combinations:

-   Blue: Welcome screen
-   Purple: Analysis phase
-   Green: Spending insights
-   Orange: Order statistics
-   Pink: Shop preferences
-   Indigo: Product insights
-   Teal: Shopping style
-   Red: Year in numbers
-   Purple: Personality
-   Pink-to-Indigo: Final sharing screen

### Animations

-   Bounce effects for money emojis
-   Pulse animations for large numbers
-   Spinning loaders for analysis
-   Smooth transitions between frames

## 📦 Project Structure

```
src/
├── App.tsx              # Main application component
├── main.tsx            # React app entry point
├── index.css           # Global styles
├── manifest.json       # Shop Mini configuration
└── icon.png           # App icon
```

## 🔧 Configuration

### Package.json Scripts

-   `npm start`: Start development server
-   `npm run build`: Build for production

### Dependencies

-   **Runtime**: React, Shop Minis SDK, html2canvas
-   **Development**: TypeScript, Tailwind CSS, Vite

## 🚀 Deployment

Built for Shopify Shop Minis platform. Follow Shopify's deployment guidelines for Shop Minis.

## 🎉 Features in Detail

### Smart Analytics

-   Calculates comprehensive shopping statistics
-   Generates personality types based on shopping behavior
-   Provides achievement-style feedback
-   Estimates values when exact data isn't available

### Cross-Platform Sharing

-   **Mobile**: Downloads image + opens Instagram app
-   **Desktop**: Downloads image with instructions
-   **Fallback**: Always provides alternative sharing methods

### Performance Optimized

-   Lazy loading of heavy components
-   Optimized image capture settings
-   Efficient state management
-   Mobile-first responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

-   Inspired by Spotify Wrapped
-   Built with Shopify Shop Minis SDK
-   Designed for mobile-first experiences

---

**Made with 💜 for the shopping community**

### OpenAI Integration

This project uses OpenAI's API to generate personalized shopping personas based on your shopping history. To set up the OpenAI integration:

1. **Get an OpenAI API Key**

    - Sign up at [OpenAI's platform](https://platform.openai.com/)
    - Create an API key in your account settings

2. **Create a .env file in the project root**

    ```
    VITE_OPENAI_API_KEY=your_api_key_here
    VITE_OPENAI_ORG_ID=your_organization_id_here  # Optional
    ```

3. **Restart your development server**
    ```bash
    npm start
    ```

The app will now generate personalized shopping personas based on the user's shopping history using OpenAI.
