/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Keyboard, View, StyleSheet,TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView} from 'react-native';

import AppNavigator from './navigation/AppNavigator';

export default class App extends Component{
  render() {
    return (
      <View style={{flex: 1}}>
        <AppNavigator/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
