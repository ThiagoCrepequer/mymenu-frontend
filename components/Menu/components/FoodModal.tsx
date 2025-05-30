import { Food } from "@/types/api/Food";
import {
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "@nextui-org/react";
import Image from "next/image";
import FoodDefault from "@/assets/default-food.jpg";
import { currency } from "@/utils/text";
import GlutenFree from "@/components/icons/GlutenFree";
import LactoseFree from "@/components/icons/LactoseFree";
import Vegan from "@/components/icons/Vegan";
import Vegetarian from "@/components/icons/Vegetarian";
import Price from "@/components/Price";
import { GoPlus } from "react-icons/go";
import { BiMinus } from "react-icons/bi";
import Button from "@/components/Button";
import { Fragment, useEffect, useRef, useState } from "react";
import { FoodOrder, useCart } from "@/hooks/useCart";
import { FoodItem } from "@/types/api/food/FoodItem";
import SimpleFoodItem from "@/components/SimpleFoodItem";
import { v4 } from "uuid";
import Textarea from "@/components/Textarea";
import { Category } from "@/types/api/Category";
import { FoodItemCategory } from "@/types/api/food/FoodItemCategory";
import { toast } from "react-toastify";

type FoodModalProps = {
  food?: Food;
  onClose: () => void;
};

export default function FoodModal({ food, onClose }: FoodModalProps) {
  const { addItem, items } = useCart();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [currentItem, setCurrentItem] = useState<FoodOrder>({
    id: v4(),
    itemId: food?.id || "",
    quantity: 1,
    image: food?.image?.url || "",
    title: food?.name || "",
    description: food?.description || "",
    price: food?.price || 0,
    discount: food?.active_discount,
    items: [],
  });

  const addSubItem = (item: FoodItem) => {
    const defaultItem = {
      id: v4(),
      itemId: item.id,
      image: item.image?.url || "",
      title: item.title,
      description: item.description,
      price: item.price_increase ?? 0,
      quantity: 1,
    };

    setCurrentItem((state) => {
      // Check if item already exists in the array
      const existingItemIndex = state.items.findIndex(
        (i) => i.itemId === item.id
      );

      if (existingItemIndex >= 0) {
        // Item exists, update its quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return {
          ...state,
          items: updatedItems,
        };
      } else {
        // Item doesn't exist, add it to the array
        return {
          ...state,
          items: [...state.items, defaultItem],
        };
      }
    });
  };
  const removeSubItem = (itemId: string) => {
    const newItems = currentItem?.items.map((item) => {
      if (item.itemId === itemId) {
        return {
          ...item,
          quantity: item.quantity - 1,
        };
      }
      return item;
    });
    setCurrentItem((state) => ({
      ...state,
      items: newItems?.filter((item) => item.quantity > 0) || [],
    }));
  };

  const handleAddToCart = () => {
    // Validate minimum items for each category
    const invalidCategories = food?.item_categories
      .filter((category) => {
        const totalSelected = getTotalSelectedByCategory(category, currentItem);
        return totalSelected < (category.min_items || 0);
      })
      .map((category) => category.title);

    if (invalidCategories && invalidCategories.length > 0) {
      // Show error message for categories that don't meet minimum requirements
      toast.error(
        `A categoria(s) ${invalidCategories.join(
          ", "
        )} não atingiu o mínimo de itens selecionados.`
      );
      return;
    }

    currentItem.observation = textAreaRef.current?.value;
    addItem(currentItem);
    onClose();
  };

  useEffect(() => {
    if (food) {
      setCurrentItem({
        id: v4(),
        itemId: food.id,
        quantity: 1,
        image: food.image?.url || "",
        title: food.name,
        description: food.description,
        price: food.price,
        discount: food.active_discount,
        items: [],
      });
    }
  }, [food]);

  return (
    <Modal
      isOpen={!!food}
      onClose={onClose}
      size="4xl"
      className="max-h-[80vh]"
    >
      <ModalContent>
        {food && (
          <>
            <ModalHeader></ModalHeader>
            <ModalBody className="overflow-auto">
              <div className="flex flex-col gap-4">
                <div className="w-full flex justify-center">
                  <Image
                    src={food.image?.url || FoodDefault}
                    width={300}
                    height={300}
                    alt={food.name}
                    className="rounded-md w-full max-w-[250px]"
                  />
                </div>
                <div className="w-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl">{food.name}</h2>
                    <p className="text-gray-500 text-sm">{food.description}</p>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex text-gray-400 gap-2">
                        {food.gluten_free && (
                          <Tooltip content="Sem glúten">
                            <GlutenFree width={24} height={24} />
                          </Tooltip>
                        )}
                        {food.lactose_free && (
                          <Tooltip content="Sem lactose">
                            <LactoseFree width={24} height={24} />
                          </Tooltip>
                        )}
                        {food.vegan && (
                          <Tooltip content="Vegano">
                            <Vegan width={24} height={24} />
                          </Tooltip>
                        )}
                        {food.vegetarian && (
                          <Tooltip content="Vegetariano">
                            <Vegetarian width={24} height={24} />
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex justify-end font-bold">
                        <Price
                          discount={food.active_discount}
                          price={food.price}
                          className="text-medium"
                          discountIcon={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {food.item_categories.length > 0 && (
                <>
                  <Divider />
                  {food.item_categories.map(
                    (category) =>
                      category.food_items.length > 0 && (
                        <Fragment key={category.id}>
                          <div className="w-full">
                            <div className="mb-2 flex justify-between items-center">
                              <div>
                                <h3 className="text-lg">{category.title}</h3>
                                <p className="text-sm text-gray-400">
                                  {category.description}
                                </p>
                              </div>
                              <div className="text-md text-gray-400">
                                {getTotalSelectedByCategory(
                                  category,
                                  currentItem
                                )}
                                /{category.max_items}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {category.food_items.map((item, index) => (
                                <Fragment key={item.id}>
                                  <SimpleFoodItem
                                    title={item.title}
                                    description={item.description}
                                    image={item.image?.url}
                                    price={item.price_increase}
                                    onClickAdd={() => {
                                      if (
                                        getTotalSelectedByCategory(
                                          category,
                                          currentItem
                                        ) < category.max_items
                                      ) {
                                        addSubItem(item);
                                      }
                                    }}
                                    onClickRemove={() => removeSubItem(item.id)}
                                    total={
                                      currentItem.items.find(
                                        (i) => i.itemId === item.id
                                      )?.quantity || 0
                                    }
                                  />
                                  {index < category.food_items.length - 1 && (
                                    <Divider />
                                  )}
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </Fragment>
                      )
                  )}
                </>
              )}
              <Textarea
                label="Observações"
                placeholder="Ex: Sem cebola, ponto da carne, etc."
                ref={textAreaRef}
              />
            </ModalBody>
            <ModalFooter>
              <div className="flex flex-row justify-between items-center w-full">
                <div>Total: {currency(calcTotal(currentItem))}</div>
                <Button
                  onPress={() => handleAddToCart()}
                  text="Adicionar ao carrinho"
                />
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

const calcTotal = (food: FoodOrder) => {
  const itemsTotal = food.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  return food.price + itemsTotal;
};

const getTotalSelectedByCategory = (
  category: FoodItemCategory,
  currentItem: FoodOrder
) => {
  return category.food_items.reduce((acc, item) => {
    const citem = currentItem.items.find((i) => i.itemId === item.id);
    return acc + (citem?.quantity || 0);
  }, 0);
};
