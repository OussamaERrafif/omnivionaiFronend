/**
 * Example queries organized by topic for the AI Deep Search landing page.
 * 
 * This module provides curated example queries organized into categories
 * to help users understand the system's capabilities and get started quickly.
 * Each query includes a description to guide users in understanding what
 * kind of research it will perform.
 * 
 * @module lib/example-queries
 */

import { Sparkles, Brain, Code, Globe, Lightbulb, Heart, TrendingUp, BookOpen } from "lucide-react"

/**
 * Example queries organized by topic with icons and descriptions.
 * 
 * Each topic group includes:
 * - Topic name
 * - Lucide icon component
 * - Array of query objects with text and description
 * 
 * Topics covered:
 * - Science: Physics, biology, chemistry topics
 * - Technology: AI, programming, blockchain
 * - Health: Wellness, nutrition, fitness
 * - History: Historical events and figures
 * - Business: Entrepreneurship, markets, trends
 * - Philosophy: Ethics, logic, metaphysics
 * - Environment: Climate, sustainability, ecology
 * - Learning: Education, skill development, study techniques
 */
export const EXAMPLE_QUERIES_BY_TOPIC = [
  {
    topic: "Science",
    icon: Brain,
    queries: [
      {
        text: "How does quantum computing work?",
        description: "Understand quantum computing fundamentals",
      },
      {
        text: "What causes black holes to form?",
        description: "Learn about black hole formation",
      },
      {
        text: "Explain CRISPR gene editing",
        description: "Discover gene editing technology",
      },
    ],
  },
  {
    topic: "Technology",
    icon: Code,
    queries: [
      {
        text: "What are the latest AI developments?",
        description: "Explore recent AI advances",
      },
      {
        text: "Best practices for React development",
        description: "Learn React best practices",
      },
      {
        text: "How does blockchain technology work?",
        description: "Understand blockchain basics",
      },
    ],
  },
  {
    topic: "Health",
    icon: Heart,
    queries: [
      {
        text: "Benefits of intermittent fasting",
        description: "Learn about fasting health benefits",
      },
      {
        text: "How to improve sleep quality?",
        description: "Discover better sleep habits",
      },
      {
        text: "Mental health management techniques",
        description: "Explore mental wellness strategies",
      },
    ],
  },
  {
    topic: "Business",
    icon: TrendingUp,
    queries: [
      {
        text: "What is sustainable business growth?",
        description: "Learn sustainable growth strategies",
      },
      {
        text: "Digital marketing trends 2025",
        description: "Explore current marketing trends",
      },
      {
        text: "Startup funding strategies",
        description: "Understand funding options",
      },
    ],
  },
  {
    topic: "Environment",
    icon: Globe,
    queries: [
      {
        text: "How does climate change affect oceans?",
        description: "Understand ocean climate impact",
      },
      {
        text: "Renewable energy solutions",
        description: "Explore clean energy options",
      },
      {
        text: "Impact of deforestation",
        description: "Learn about forest conservation",
      },
    ],
  },
  {
    topic: "Education",
    icon: BookOpen,
    queries: [
      {
        text: "Effective online learning strategies",
        description: "Improve your online learning",
      },
      {
        text: "How to learn programming efficiently?",
        description: "Master coding skills faster",
      },
      {
        text: "Benefits of lifelong learning",
        description: "Explore continuous education",
      },
    ],
  },
]

// Flatten for backward compatibility
export const EXAMPLE_QUERIES = EXAMPLE_QUERIES_BY_TOPIC.flatMap((category) =>
  category.queries.map((query) => ({
    text: query.text,
    icon: category.icon,
    description: query.description,
  }))
)
