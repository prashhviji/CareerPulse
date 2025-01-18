"use client"

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Plus, Pizza, X, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Type Definitions
type NutrientValue = number;
type TimeString = string;
type QueryString = string;
type ErrorMessage = string | null;

interface BMICategory {
  category: "Underweight" | "Normal weight" | "Overweight" | "Obese";
  color:
    | "text-blue-600"
    | "text-green-600"
    | "text-yellow-600"
    | "text-red-600";
}

interface NutrientInfo {
  calories: NutrientValue;
  carbs: NutrientValue;
  protein: NutrientValue;
  fat: NutrientValue;
  fiber: NutrientValue;
  sugar: NutrientValue;
}

interface FoodItem extends NutrientInfo {
  food: string;
  time: TimeString;
}

interface DashboardState {
  meals: FoodItem[];
  searchQuery: QueryString;
  searchResults: FoodItem[];
  showAddForm: boolean;
  loading: boolean;
  error: ErrorMessage;
  height: string;
  weight: string;
  bmi: number | null;
  dailyTotals: NutrientInfo;
}

interface EdamamNutrient {
  ENERC_KCAL: NutrientValue;
  PROCNT: NutrientValue;
  FAT: NutrientValue;
  CHOCDF: NutrientValue;
  FIBTG: NutrientValue;
  SUGAR: NutrientValue;
}

interface EdamamResponse {
  hints: Array<{
    food: {
      label: string;
      nutrients: EdamamNutrient;
    };
  }>;
}

const NutritionDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    meals: [],
    searchQuery: "",
    searchResults: [],
    showAddForm: false,
    loading: false,
    error: null,
    height: "",
    weight: "",
    bmi: null,
    dailyTotals: {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    },
  });

  // Utility functions
  const formatNutrient = (value: NutrientValue): string => {
    return Math.round(value).toString();
  };

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmiValue: number): BMICategory => {
    if (bmiValue < 18.5)
      return { category: "Underweight", color: "text-blue-600" };
    if (bmiValue < 25)
      return { category: "Normal weight", color: "text-green-600" };
    if (bmiValue < 30)
      return { category: "Overweight", color: "text-yellow-600" };
    return { category: "Obese", color: "text-red-600" };
  };

  // Event handlers
  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setState((prev) => ({ ...prev, searchQuery: event.target.value }));
  };

  const handleFoodSelect = (foodItem: FoodItem): void => {
    setState((prev) => {
      const updatedMeals = [
        ...prev.meals,
        { ...foodItem, time: new Date().toLocaleTimeString() },
      ];

      // Update totals immediately after adding a new meal
      const newTotals = updatedMeals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          carbs: acc.carbs + meal.carbs,
          protein: acc.protein + meal.protein,
          fat: acc.fat + meal.fat,
          fiber: acc.fiber + meal.fiber,
          sugar: acc.sugar + meal.sugar,
        }),
        {
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
        }
      );

      return {
        ...prev,
        meals: updatedMeals,
        showAddForm: false,
        searchResults: [],
        searchQuery: "",
        dailyTotals: newTotals,
      };
    });
  };

  const handleBMICalculation = (): void => {
    if (state.height && state.weight) {
      const heightNum = parseFloat(state.height);
      const weightNum = parseFloat(state.weight);

      if (
        isNaN(heightNum) ||
        isNaN(weightNum) ||
        heightNum <= 0 ||
        weightNum <= 0
      ) {
        setState((prev) => ({
          ...prev,
          error: "Please enter valid height and weight values",
        }));
        return;
      }

      const bmiValue = calculateBMI(heightNum, weightNum);
      setState((prev) => ({
        ...prev,
        bmi: parseFloat(bmiValue.toFixed(1)),
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: "Please enter both height and weight",
      }));
    }
  };

  // API call with proper typing and error handling
  const searchFood = async (query: string): Promise<void> => {
    if (!query) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const APP_ID = process.env.NEXT_PUBLIC_EDAMAM_APP_ID;
      const APP_KEY = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY;

      if (!APP_ID || !APP_KEY) {
        throw new Error("API credentials are not properly configured");
      }

      const encodedQuery = encodeURIComponent(query);

      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${encodedQuery}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: EdamamResponse = await response.json();

      if (!data.hints || data.hints.length === 0) {
        setState((prev) => ({
          ...prev,
          searchResults: [],
          loading: false,
          error: "No results found for your search.",
        }));
        return;
      }

      const formattedResults: FoodItem[] = data.hints
        .slice(0, 5)
        .map((hint) => ({
          food: hint.food.label,
          calories: hint.food.nutrients.ENERC_KCAL || 0,
          protein: hint.food.nutrients.PROCNT || 0,
          fat: hint.food.nutrients.FAT || 0,
          carbs: hint.food.nutrients.CHOCDF || 0,
          fiber: hint.food.nutrients.FIBTG || 0,
          sugar: hint.food.nutrients.SUGAR || 0,
          time: new Date().toLocaleTimeString(),
        }));

      setState((prev) => ({
        ...prev,
        searchResults: formattedResults,
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error("Search Food Error:", err);
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch food data. Please try again.",
        loading: false,
        searchResults: [],
      }));
    }
  };

  // Debounced search effect with cleanup
  useEffect(() => {
    let isActive = true;
    const timeoutId = setTimeout(() => {
      if (state.searchQuery && isActive) {
        searchFood(state.searchQuery);
      }
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [state.searchQuery]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* BMI Calculator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-6 h-6" />
            BMI Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={state.height}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, height: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Height in cm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={state.weight}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, weight: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Weight in kg"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBMICalculation}
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Calculate BMI
              </button>
            </div>
          </div>
          {state.error && (
            <Alert className="mt-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state.bmi && (
            <div className="mt-4">
              <p className="text-lg">
                Your BMI: <span className="font-bold">{state.bmi}</span>
                {" - "}
                <span className={getBMICategory(state.bmi).color}>
                  {getBMICategory(state.bmi).category}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Macro Nutrients Display */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Total Calories</h3>
          <p className="text-2xl text-green-600">
            {formatNutrient(state.dailyTotals.calories)} cal
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Carbs</h3>
          <p className="text-2xl text-blue-600">
            {formatNutrient(state.dailyTotals.carbs)}g
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Protein</h3>
          <p className="text-2xl text-red-600">
            {formatNutrient(state.dailyTotals.protein)}g
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Fat</h3>
          <p className="text-2xl text-purple-600">
            {formatNutrient(state.dailyTotals.fat)}g
          </p>
        </div>
      </div>

      {/* Nutrition Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.meals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#10B981" />
                <Line type="monotone" dataKey="carbs" stroke="#3B82F6" />
                <Line type="monotone" dataKey="protein" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Add Food Button */}
      <button
        onClick={() => setState((prev) => ({ ...prev, showAddForm: true }))}
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg 
        hover:bg-green-600 transition-colors duration-200"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Food Modal */}
      {state.showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Food</h2>
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, showAddForm: false }))
                }
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <input
              type="text"
              value={state.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for a food..."
              className="w-full p-2 border rounded mb-4"
            />

            {state.loading && <p className="text-gray-600">Searching...</p>}
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="max-h-60 overflow-y-auto">
              {state.searchResults.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleFoodSelect(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                >
                  <div className="font-medium">{item.food}</div>
                  <div className="text-sm text-gray-600">
                    {formatNutrient(item.calories)} cal |{" "}
                    {formatNutrient(item.protein)}g protein |{" "}
                    {formatNutrient(item.carbs)}g carbs
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.meals.map((meal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Pizza className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">{meal.food}</span>
                </div>
                <div className="text-gray-600">
                  {formatNutrient(meal.calories)} cal |{" "}
                  {formatNutrient(meal.carbs)}g carbs |{" "}
                  {formatNutrient(meal.protein)}g protein
                </div>
              </div>
            ))}
            {state.meals.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No meals added yet. Click the + button to add your first meal.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionDashboard;