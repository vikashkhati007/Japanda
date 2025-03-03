import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button, SearchBar } from '@rneui/themed';
import React from 'react';


export default function HomeScreen() {
  const [search, setSearch] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [notFound, setNotFound] = React.useState(false);

  const updateSearch = (search:any) => {
    setSearch(search);
  };
  const onSubmit = async () =>{
    setNotFound(false);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${search}`);
    const data = await response.json();
    if (data.title === "No Definitions Found") {
      setNotFound(true);
      setResult(null);
    }
    else{
          setResult(data);
    }

    console.log(result)
  }
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedText>Welcome to Japanese Learning <HelloWave/></ThemedText>
      }>
      <ThemedView style={styles.view}>
      <SearchBar
      placeholder="Type Here..."
      onChangeText={updateSearch}
      value={search}
      platform='android'
      containerStyle={styles.searchContainer}
      inputContainerStyle={styles.searchInputContainer}
      inputStyle={styles.searchInput}
      searchIcon={{ size: 24 }}
    />
    <Button title="Search" onPress={onSubmit}
    style={styles.searchInputContainer}
    />
    <ThemedText>Results</ThemedText>
    {notFound ? (
        <ThemedText>Result Not Found</ThemedText>
      ) : (result && result.map((item: any, index: number) => (
      <ThemedView key={index}>
        <ThemedText>Word: {item.word}</ThemedText>
        {item.meanings.map((meaning: any, meaningIndex: number) => (
          <ThemedView key={meaningIndex}>
            <ThemedText>
              {meaning.partOfSpeech}: {meaning.definitions[0].definition}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    )))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  view: {
    margin: 10,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  searchInput: {
    color: '#000',
    paddingHorizontal: 2,
  }
,
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
 
});
