import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)
      
      const productIndex = cart.findIndex(product => product.id === productId)

      if (productIndex < 0) {
        if (stock.amount < 1 ) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }

        const { data: product } = await api.get(`/products/${productId}`)
        
        const newCart = [...cart, {...product, amount: 1}]
        updateCartStorage(newCart)
      } else {
        const productAmount = cart[productIndex].amount + 1

        if (stock.amount < productAmount ) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }

        const newCart = cart.map(product => product.id === productId ? {...product, amount: productAmount } : product)
        updateCartStorage(newCart)
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId)

      if (productIndex < 0) {
        toast.error('Erro na remoção do produto')
        return
      }
      
      const newCart = cart.filter(product => product.id !== productId)
      updateCartStorage(newCart)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId)

      if (productIndex < 0) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }

      if (amount < 1) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }
      
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const newCart = cart.map(product => product.id === productId ? {...product, amount: amount } : product)
      updateCartStorage(newCart)
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  function updateCartStorage(newCart: Product[]) {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    
    setCart(newCart)
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}