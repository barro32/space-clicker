import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Output from './Ouput';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Output/>
        <Text>Tappy tap</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
