import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const merchandise = await AsyncStorage.getItem('@GoMarketplace:products');

      if (merchandise) {
        setProducts([...JSON.parse(merchandise)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const newProductAdded = product;
      const isAlreadyAdded = products.findIndex(
        merchandise => merchandise.id === newProductAdded.id,
      );
      const productsAlreadyAdded = products;
      if (isAlreadyAdded < 0) {
        // não existe, precisa adicionar quantity = 1
        newProductAdded.quantity = 1;
        setProducts([...products, newProductAdded]);
      } else {
        // existe, precisa atualizar quantity
        productsAlreadyAdded[isAlreadyAdded].quantity += 1;
        setProducts([...productsAlreadyAdded]);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsAlreadyAdded = products;
      const currentProduct = products.findIndex(
        merchandise => merchandise.id === id,
      );
      productsAlreadyAdded[currentProduct].quantity += 1;

      setProducts([...productsAlreadyAdded]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsAlreadyAdded = products;
      const currentProduct = products.findIndex(
        merchandise => merchandise.id === id,
      );
      productsAlreadyAdded[currentProduct].quantity -= 1;
      if (productsAlreadyAdded[currentProduct].quantity < 1) {
        const removeProduct = products.filter(
          merchandise => merchandise.id !== id,
        );
        setProducts(removeProduct);
      } else {
        setProducts([...productsAlreadyAdded]);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
