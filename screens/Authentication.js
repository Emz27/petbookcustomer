import React, { Component } from 'react'
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage';

import firebase from 'react-native-firebase';
import moment from 'moment'

function getCurrentPosition(options = {}){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

export default class AuthLoading extends Component{
  constructor(props){
    super(props);
  }
  async componentDidMount(){
    await this.loadData();
  }
  async loadData(){
    var user = JSON.parse(await AsyncStorage.getItem("user"));
    console.log("user: ", user);
    if(user && user.userDocId){
      console.log("user session found!")
      try{
        console.log("retrieving user details...");
        var result = await firebase.firestore().collection("users").where("username", "==", user.username).get();
        if(result.docs.length == 0){
          console.log("user details not found on the server!");
          console.log("deleting session...");
          await AsyncStorage.clear();
          console.log("Redirecting to Login");
          return this.props.navigation.navigate("Login");
        }
        console.log("user details retrived!");
        let location = {
          latitude: 0,
          longitude: 0,
        }
        try{
          let pos = await getCurrentPosition();
          if(pos){
            location = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }
          }
        }
        catch(e){console.error(e.message)}
        user = {
          ...result.docs[0].data(),
          userDocId: result.docs[0].id,
          location: location,
        }
        console.log("saving user session...");
        await AsyncStorage.setItem("user", JSON.stringify(user));
        console.log("user session saved!")
        console.log("\n\n<-- Redirecting to Main -->\n\n");
        this.props.navigation.navigate("Main", {user});
      }
      catch(e){console.log(e)}
    }
    else {
      console.log("User session not found")
      console.log("\n\n<-- Redirecting to Login -->\n\n");
      this.props.navigation.navigate("Login");
    }
  }
  render(){
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}
var styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent: "center",
    alignItems: "center",
  }
})