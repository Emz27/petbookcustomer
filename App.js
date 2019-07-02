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
import OfflineNotice from './components/OfflineNotice';
import LinearGradient from 'react-native-linear-gradient';

export default class App extends Component{
  render() {
    return (
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={{flex: 1}}>
        <AppNavigator/>
        <OfflineNotice/>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
