import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  TouchableNativeFeedback,
  Button,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import posed from 'react-native-pose';
import firebase from 'react-native-firebase';
import moment from 'moment';

export default class Transaction extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      selectedTransaction: {},
      transactions: [],
      connections: [],
    }
    this.user = this.props.navigation.getParam('user');

    this.transactionListener = ()=>{}
    this.connectionListener = ()=>{}

    this.loadTransactions();
  }
  static navigationOptions = {
    header: null,
  };
  async componentWillUnmount(){
    this.transactionListener();
    this.connectionListener();
  }
  async loadConnection(){

    if(this.state.selectedTransaction.transactionDocId){
      this.connectionListener();
      this.connectionListener = firebase.firestore().collection("reservations").doc(this.state.selectedTransaction.transactionDocId)
      .collection("connections")
      .onSnapshot(async (snapshot)=>{
        let connections = [];

        if(snapshot.docs.length){
          for(let doc of snapshot.docs){
            let data = doc.data();
            let id = doc.id;
            connections.push({
              ...data,
              connectionDocId: id,
            })
          }
        }
        connections = connections.filter(c=>{
          return c.isAvailable
        })
        this.setState({
          connections
        })
      })
    }
  }
  async loadTransactions(){

    this.user = JSON.parse(await AsyncStorage.getItem("user"));
    let test = await firebase.firestore().collection("reservations").get();
    console.log(test.docs);

    this.transactionListener = firebase.firestore().collection("reservations").where("customerDocId", "==", this.user.userDocId)
    .onSnapshot((snapShot)=>{
      console.log("transaction updated!");
      let transactions = [];
      if(snapShot.docs.length){
        for(let doc of snapShot.docs){
          let data = doc.data();
          let id = doc.id;
          transactions.push({
            ...data,
            transactionDocId: id,
            key: id,
          })
        }
      }
      this.setState({ transactions: transactions });
    });
  }
  render() {
    let transactions = [...this.state.transactions];
    return (
      <View style={styles.container}>
        <View style={{elevation: 5, height: 80, backgroundColor: "white"}}>
          <View style={{marginLeft: "auto", bottom: -30}}><Button title="Logout" onPress={()=>{ 
              AsyncStorage.clear();
              this.props.navigation.navigate("Login");
            }}
            /></View>
        </View>
        <View style={styles.focus}>
                    {(this.state.selectedTransaction && this.state.selectedTransaction.transactionDocId)?
          <View style={{flex:1, flexDirection: "row"}}>
            <View style={[styles.detailContainer]}>
              <View>
                <Text>Service Name </Text>
                <Text style={{marginLeft:20 , fontSize: 20,fontWeight: "bold"}}>{ this.state.selectedTransaction.serviceName }</Text>
              </View>
              <View>
                <Text>Price </Text>
                <Text style={{marginLeft:20 , fontSize: 14,fontWeight: "bold"}}>P{ this.state.selectedTransaction.minPrice } - P{ this.state.selectedTransaction.maxPrice}</Text>
              </View>
              <View>
                <Text>Duration </Text>
                <Text style={{marginLeft:20 , fontSize: 14,fontWeight: "bold"}}>
                  {(()=>{
                    let time = "";
                    if(this.state.selectedTransaction.duration >= 60){
                      time += Math.floor(this.state.selectedTransaction.duration / 60) + " hour ";
                      if((this.state.selectedTransaction.duration % 60) > 0) time += this.state.selectedTransaction.duration % 60 + " minutes"
                    }
                    else time += this.state.selectedTransaction.duration + " minutes";
                    return time;
                  })()}
                </Text>
              </View>
              <View>
                <Text>Message</Text>
                <Text style={{marginLeft:20 , fontSize: 14,fontWeight: "bold"}}>{this.state.selectedTransaction.message}</Text>
              </View>
            </View>
            <View style={{flex: 1}}>
              <View style={styles.responseContainer}>
                <View>
                  <Text>Status </Text>
                  <Text style={{marginLeft:20 , fontSize: 20,fontWeight: "bold"}}>{ this.state.selectedTransaction.status }</Text>
                </View>
                <View style={{height: 2,width: "auto", backgroundColor: "#5eb8ff"}} />
                  <View>
                      <View>
                        <Text>Appointment Date & Time</Text>
                        <Text style={{marginLeft:20 , fontSize: 14,fontWeight: "bold"}}>{moment(this.state.selectedTransaction.dateTimeStart.toDate()).format("MM/DD/YYYY")}</Text>
                        <Text style={{marginLeft:20 , fontSize: 14,fontWeight: "bold"}}>{moment(this.state.selectedTransaction.dateTimeStart.toDate()).format("h:mm a") + " - " + moment(this.state.selectedTransaction.dateTimeEnd.toDate()).format("h:mm a")}</Text>
                      </View>
                  </View>
              </View>
              <View style={styles.buttonContainer}>
                <View style={styles.button}>
                  {(this.state.connections.length)?
                  <Button title="Stream" 
                    onPress={async ()=>{
                      this.props.navigation.navigate('StreamService', {transaction: this.state.selectedTransaction});
                    }}
                  />
                  :null}
                </View>
                <View style={styles.button}>
                  {(this.state.selectedTransaction && this.state.selectedTransaction.status != "cancelled")?
                  <Button size="small" onPress={()=>{
                    Alert.alert(
                      '',
                      'Are you sure you want to cancel this transaction?',
                      [
                        {
                          text: 'No',
                          onPress: () => console.log('Cancel Pressed'),
                        },
                        {text: 'Yes', onPress: async () => {
                          await firebase.firestore().collection("reservations").doc(this.state.selectedTransaction.transactionDocId)
                          .update({
                            status: "cancelled",
                            statusOrder: 10,
                          });
                          this.setState({
                            selectedTransaction: {},
                          })
                        }},
                      ],
                      {cancelable: true},
                    );
  
                  }} title="Cancel" />
                  :null}
                </View>
              </View>
            </View>
            
          </View>
                    :<Text>Select Transactions</Text>}
        </View>
        <View style={styles.headerContainer}>
          <View style={styles.headerItem}>
            <Text style={{ fontWeight: "bold" }}>Service Name</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={{ fontWeight: "bold" }}>Status</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={{ fontWeight: "bold" }}>Appointment Date</Text>
          </View>
        </View>
        <View style={{flexDirection: "row"}}>
          <View style={{flex: 1,height: 4, backgroundColor: "#5eb8ff"}} />
          <View style={{flex: 1,height: 4, backgroundColor: "#0288d1"}} />
          <View style={{flex: 1,height: 4, backgroundColor: "#5eb8ff"}} />
        </View>
        <FlatList
          style={styles.list}
          data={ transactions }
          renderItem={({item, index}) => 
          
          <TouchableNativeFeedback 
            onPress={()=>{
              this.setState({ selectedTransaction: item}, async ()=>{
                console.log(`selected ${this.state.selectedTransaction.transactionDocId}`);
                this.loadConnection();
              })
            }}
            background={TouchableNativeFeedback.SelectableBackground()}
          >
            <View style={{backgroundColor: "white", marginBottom: 4}}>

              <View style={styles.itemContainer}>
                <View style={{flex: 1, alignItems: "center"}}>
                  <Text>
                    {item.serviceName}
                  </Text>
                </View>
                <View style={{flex: 1, alignItems: "center"}}>
                  <Text>{item.status}</Text>
                </View>
                <View style={{flex: 1, alignItems: "center"}}>
                  <Text>{moment(item.dateTimeStart.toDate()).format("MM/DD/YYYY")}</Text>
                </View>
              </View>
              <View style={{flexDirection: "row"}}>
                <View style={{flex: 1,height: 4, backgroundColor: "#5eb8ff"}} />
                <View style={{flex: 1,height: 4, backgroundColor: "#0288d1"}} />
                <View style={{flex: 1,height: 4, backgroundColor: "#5eb8ff"}} />
              </View>
            </View>
          </TouchableNativeFeedback>
        }/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  focus: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    height: 30,
    borderTopWidth: 1,
    marginVertical: 5,
    alignItems: "center",
  },
  headerItem: {
    flex: 1,
    alignItems: "center",
  },
  itemContainer: {
    padding: 5,
    flexDirection: "row"
  },
  detailContainer: {
    padding: 5,
    paddingLeft: 10,
    flex: 1,
  },
  responseContainer: {
    flex: 1,
  },
  buttonContainer: {
    width: 120,
    flexDirection: "row",
  },
  button: {
    margin: 10,
    width: 70,
  }
});
