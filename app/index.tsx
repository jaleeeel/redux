import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device"; // Native module via Expo
import * as Haptics from "expo-haptics"; // Native module via Expo
import * as React from "react";
import { useMemo, useState } from "react";
import { FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Appbar, Avatar, Banner, Button, Card, Divider, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider, Switch, Text, TextInput } from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

/********************
 * Managing State with Redux
 * 1) Introduction to Redux
 * 2) Actions, reducers, store
 * 3) Connecting components
 ********************/

// UI slice: theme + banners
const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, showBanner: true },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
    showBanner(state) {
      state.showBanner = true;
    }
  },
});

// Counter slice to demonstrate basic actions
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    reset(state) {
      state.value = 0;
    },
    addByAmount(state, action) {
      state.value += action.payload;
    },
  },
});

// Todo slice to demonstrate lists and immutable updates
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return { payload: { id: nanoid(), title, done: false, createdAt: Date.now() } };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
  },
});

const { toggleDarkMode, dismissBanner, showBanner } = uiSlice.actions;
const { increment, decrement, reset, addByAmount } = counterSlice.actions;
const { addTodo, toggleTodo, removeTodo, clearTodos } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    counter: counterSlice.reducer,
    todos: todosSlice.reducer,
  },
});

/********************
 * App Root
 ********************/

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(() => (darkMode ? MD3DarkTheme : MD3LightTheme), [darkMode]);
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}

/********************
 * User Interface Design
 * 1) Designing UIs for mobile
 * 2) Responsive/adaptive
 * 3) Best practices for mobile UI/UX (accessibility, touch targets, feedback)
 ********************/

function AppScaffold() {
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const showBannerValue = useSelector((s) => s.ui.showBanner);

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content title="Redux Demo" subtitle={`Running on ${Device.osName ?? "Unknown OS"}`} />
        <DarkModeSwitch />
      </Appbar.Header>

      {showBannerValue && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissBanner()) }]}
          icon={({ size }) => (
            <Avatar.Icon size={size} icon="information-outline" />
          )}
        >
          A todo was added! This screen demonstrates Redux state, responsive layout (Haptics, Device).
        </Banner>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[isTablet && styles.contentTablet, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <TodosCard />
          
        </View>
      </ScrollView>

      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content title="Footer" subtitle={Platform.select({ ios: "iOS", android: "Android", default: "Web" })} />
      </Appbar>
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      <Text accessibilityRole="header" style={{ marginRight: 8 }}>{darkMode ? "Dark" : "Light"}</Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        accessibilityLabel="Toggle dark mode"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}

/********************
 * Working with External Libraries
 * 1) Using third-party libs (React Native Paper for UI)
 * 2) Popular libs showcase (Paper components)
 * 3) Integrating native modules (expo-haptics, expo-device)
 ********************/

function CounterCard() {
  const dispatch = useDispatch();
  const value = useSelector((s) => s.counter.value);
  const [customAmount, setCustomAmount] = useState("1");

  const bump = async (delta) => {
    // Haptic feedback for good UX
    await Haptics.selectionAsync();
    dispatch(addByAmount(delta));
  };

  
}

function TodosCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items);
  const [title, setTitle] = useState("");
  const [showDoneCard, setShowDoneCard] = useState(false);
  const [doneTitle, setDoneTitle] = useState("");
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1; // responsive list

  // Helper to add todo and show banner
  const handleAddTodo = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(showBanner());
  };

  // Handle toggle and show card if marking done
  const handleToggleTodo = (item) => {
    dispatch(toggleTodo(item.id));
    if (!item.done) { // means it's just been marked as done
      setDoneTitle(item.title);
      setShowDoneCard(true);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="Todos (Redux list)" subtitle="Responsive FlatList" left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />} />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <Button mode="contained" onPress={handleAddTodo}>Add</Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        <FlatList
          data={items}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ flex: 1, marginRight: numColumns > 1 ? 8 : 0 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon={item.done ? "check" : "circle-outline"} />}
              />
              <Card.Actions>
                <Button onPress={() => handleToggleTodo(item)}>{item.done ? "Undo" : "Done"}</Button>
                <Button onPress={() => dispatch(removeTodo(item.id))} textColor="#d11">Remove</Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={<Text accessibilityLabel="Empty list">No todos yet. Add one above.</Text>}
        />
        {items.length > 0 && (
          <Button style={{ marginTop: 8 }} onPress={() => dispatch(clearTodos())}>Clear All</Button>
        )}

        {showDoneCard && (
          <Card style={{ marginTop: 16, backgroundColor: "#e0ffe0" }}>
            <Card.Title title="Task Completed!" left={(props) => <Avatar.Icon {...props} icon="check" />} />
            <Card.Content>
              <Text>You finished: <Text style={{ fontWeight: "bold" }}>{doneTitle}</Text></Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowDoneCard(false)}>Close</Button>
            </Card.Actions>
          </Card>
        )}
      </Card.Content>
    </Card>
  );
}

function LibraryCard() {
  
}

function NativeModulesCard() {
  
}

/********************
 * Styles — mobile‑first, adapt on tablets
 ********************/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  containerTablet: { paddingHorizontal: 12 },
  content: { flex: 1, padding: 12 },
  contentTablet: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  columnTablet: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },
});