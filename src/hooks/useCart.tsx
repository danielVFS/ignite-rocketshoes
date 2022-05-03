import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const storagedCart = cart;

      const stock: Stock = (await api.get(`/stock/${productId}`)).data;

      const storagedProduct = storagedCart.find((p) => p.id === productId);

      if (storagedProduct) {
        if (storagedProduct.amount < stock.amount) {
          const updatedStorage = storagedCart.map((product) =>
            product.id === productId
              ? { ...product, amount: (storagedProduct.amount += 1) }
              : product
          );

          setCart(updatedStorage);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        const product: Product = await (
          await api.get(`/products/${productId}`)
        ).data;

        product.amount = 1;
        setCart((prev) => [...prev, product]);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const storagedCart = cart;

      const storagedProduct = storagedCart.find((p) => p.id === productId);

      if (storagedProduct) {
        const products = storagedCart.filter(
          (cart) => cart.id !== storagedProduct.id
        );
        setCart(products);
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const storagedCart = cart;

      const stock: Stock = (await api.get(`/stock/${productId}`)).data;

      const storagedProduct = storagedCart.find((p) => p.id === productId);

      if (storagedProduct) {
        if (amount <= stock.amount) {
          const updateCart = storagedCart.map((product) =>
            product.id === productId ? { ...product, amount: amount } : product
          );
          setCart(updateCart);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

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
