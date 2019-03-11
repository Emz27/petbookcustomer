import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} from 'react-native';

import posed from 'react-native-pose';
import firebase from 'react-native-firebase';

export default class ServiceDetail extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('service', {serviceName: ""}).serviceName,
    };
  };
  constructor(props){
    super(props);

    this.state = {
      service: this.props.navigation.getParam('service'),
      imagesUrl: [],
    }
    console.ignoredYellowBox = [
      'Setting a timer'
    ]
    this.serviceListener = ()=>{};
  }
  componentDidMount(){
    this.loadService();
  }
  componentWillUnmount(){
    this.serviceListener();
  }
  loadService(){
    console.log(this.props.navigation.getParam('service').serviceDocId);
    this.serviceListener = firebase.firestore().collection("services").doc(this.props.navigation.getParam('service').serviceDocId)
    .onSnapshot((snapShot)=>{
      console.log("service update!");
      if(snapShot){
        try{
          let data = snapShot.data();
          let id = snapShot.id;
          (async ()=>{
            let imagesUrl = [...this.state.imagesUrl];
            for( let image of data.images){
              let url = "";
              try{
                url = await firebase.storage().ref("services/"+id+"/"+image).getDownloadURL()
              }
              catch(e){console.log(e.message)} 
  
              if(url)imagesUrl.push(url)
            }
            this.setState({ imagesUrl: imagesUrl})
          })()
          
          this.setState({
            service: {...data, serviceDocId: id, key: id},
          })
        }
        catch(e){console.log(e)}
      }
    })
  }
  render() {
    let minPrice = this.state.service.minPrice;
    let maxPrice = this.state.service.maxPrice;
    let minHour = this.state.service.minHour;
    let maxHour = this.state.service.maxHour;
    let details = this.state.service.details;
    let petshopName = this.state.service.petshopName;
    let duration = this.state.service.duration;
    let imagesUrl = this.state.imagesUrl;
    return (
      <View style={styles.container}>
        <View>
          <View style={{flexDirection: "row"}}>  
            <View style={{flex: 1}}>
              <View><Text style={[styles.label]}>Petshop</Text><Text>{petshopName}</Text></View>
              <View><Text style={styles.label}>Price: </Text><Text style={{fontWeight: "normal",}}>P{minPrice} - P{maxPrice}</Text></View>
              <View><Text style={styles.label}>Duration: </Text>
              <Text style={{fontWeight: "normal",}}>
                {(()=>{
                  let time = "";
                  if(duration >= 60){
                    time += Math.floor(duration / 60) + " hour ";
                    if((duration % 60) > 0) time += duration % 60 + " minutes"
                  }
                  else time += duration + " minutes";
                  return time;
                })()}
              </Text>
              </View>
            </View>
            <View style={{flex: 1}}>
              <Button 
                onPress={()=>{this.props.navigation.navigate('Book', {service: this.state.service});}} 
                title="Book now!" />
            </View>
          </View>
          
          <View style={{marginTop: 30,}}>
            <Text style={styles.label}>Details</Text>
            <Text>{details}</Text>
          </View>
        </View>
        <View style={{alignItems: "center",marginTop: 40}}>
          {imagesUrl.map((m)=>
            <Image key={m} source={{
              uri: m,
              method: 'POST',
              headers: {
                Pragma: 'no-cache',
              },
              body: 'Your Body goes here',
            }}
            style={{width: 50, height: 50, backgroundColor: "blue"}} />
          )}
          
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 25,
  },
  label: {
    fontWeight: "bold",
  }
});
