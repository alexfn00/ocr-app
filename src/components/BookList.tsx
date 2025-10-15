import React from "react";
import { View, Text } from "@tarojs/components";
import styles from "./BookList.module.scss";

interface Book {
  title: string;
  author: string;
  isbn: string;
  price?: string | number;
}

interface BookListProps {
  books: Book[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const BookList: React.FC<BookListProps> = ({
  books,
  selectedIndex,
  onSelect,
}) => {
  return (
    <View className={styles.booksList}>
      {books.map((book, index) => (
        <View
          key={index}
          className={`${styles.bookCard} ${
            selectedIndex === index ? styles.selected : ""
          }`}
          onClick={() => onSelect(index)}
        >
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>{book.title}</Text>
            <Text className={styles.cardExtra}>{book.author}</Text>
          </View>
          <View className={styles.cardNote}>ISBN: {book.isbn}</View>
          <View className={styles.cardBody}>
            <Text>定价：{book.price ?? "暂无"}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default BookList;
