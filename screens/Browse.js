import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Picker,
  StyleSheet,
  TextInput,
  Text,
  TouchableNativeFeedback ,
  View,
  FlatList,
  Button,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import posed from 'react-native-pose';
import firebase from 'react-native-firebase';
import moment from 'moment'

const FilterContainer = posed.View({
  open: { 
    y: 0 ,
    transition: {
      y: { ease: 'linear', duration: 200}
    }
  },
  close: { 
    y: 200 ,
    transition: {
      y: { ease: 'linear', duration: 200 }
    }
  }
  
});

const FilterToggle = posed.View({
  label: 'sidebar',
  open: { 
    y: 0 ,
    transition: {
      y: { ease: 'linear', duration: 200}
    }
  },
  close: { 
    y: 200 ,
    transition: {
      y: { ease: 'linear', duration: 200 }
    }
  }
});
function rad(x) {
  return x * Math.PI / 180;
};
function getDistance(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.latitude - p1.latitude);
  var dLong = rad(p2.longitude - p1.longitude);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function getCurrentPosition(options = {}){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

export default class Browse extends React.Component {
  static navigationOptions = {
    //header: null,
  };
  constructor(){
    super();
    this.state = {
      isFilterOpen: false,
      filteredServices: [],
      services: [],
      petshops: [],
      reservations: [],
      priceFilter: "",
      petshopFilter: "",
      serviceFilter: "",
      dateTimeFilter: moment(),
    }
    this.timeSlots = ["8:00 am","8:30 am","9:00 am","9:30 am","10:00 am","10:30 am","11:00 am","11:30 am",
    "12:00 pm","12:30 pm","1:00 pm","1:30 pm","2:00 pm","2:30 pm","3:00 pm","3:30 pm","4:00 pm","4:30 pm","5:00 pm","5:30 pm",
    "6:00 pm","6:30 pm","7:00 pm","7:30 pm","8:00 pm","8:30 pm","9:00 pm","9:30 pm","10:00 pm","10:30 pm","11:00 pm",];

    this.serviceListener = ()=>{};
    this.reservationListener = ()=>{};
  }
  async componentDidMount(){
    await this.loadUser();
    this.loadData();
  }
  componentWillUnmount(){
    this.serviceListener();
    this.reservationListener();
    this.groomerListener();
  }
  async loadUser(){
    this.user = JSON.parse(await AsyncStorage.getItem("user"));
  }
  onFilterChange = (input)=>{
    this.setState({
      ...input,
    }, ()=>{
      this.filterServices();
    });
  }
  async loadGroomers(data){
    let groomers = [];
    for(let doc of data.docs){
      let data = doc.data();
      let id = doc.id;
      groomers.push({
        groomerDocId: id,
        ...data,
      });
    }
    this.setState({
      groomers
    });
  }
  async loadReservations(data){
    let reservations = [];
    for(let doc of data.docs){
      let data = doc.data();
      let id = doc.id;
      reservations.push({
        reservationDocId: id,
        ...data,
        dateTimeStart: moment(data.dateTimeStart),
        dateTimeEnd: moment(data.dateTimeEnd),
        dateTime: moment(data.dateTime),
      });
    }
    reservations.sort(function(a,b){
      return b.dateTimeStart.toDate() - a.dateTimeStart.toDate();
    });
    this.setState({
      reservations
    }, ()=>{
      this.filterServices()
    });
  }
  async loadServices(records){
    let services = [];
    let petshops = [];
    for(let doc of records.docs){
      let data = doc.data();
      let id = doc.id;
      let service = {
        ...data,
        key: id,
        serviceDocId: id,
        distance: getDistance(this.user.location, data.location)
      }
      let petshop = {
        key: data.petshopDocId,
        petshopDocId: data.petshopDocId,
        shopName: data.petshopName,
      }

      if(petshops.findIndex(p=>p.petshopDocId == petshop.petshopDocId) <= -1){
        petshops.push(petshop);
      }
      services.push(service);
    }
    this.setState({services, petshops},()=>{
      this.filterServices()
    })
  }
  async filterServices(){
    let services = [...this.state.services];
    let petshops = [...this.state.petshops];
    let filteredServices = [];

    for(let service of services){
      let priceFilter = this.state.priceFilter;
      let petshopFilter = this.state.petshopFilter;
      let serviceFilter = this.state.serviceFilter;

      if(priceFilter && (priceFilter < service.minPrice || priceFilter > service.maxPrice)) continue;
      if(petshopFilter && service.petshopDocId != petshopFilter) continue;
      if(serviceFilter){
        let textOccurence = 0;
        var re = new RegExp(serviceFilter,"g");
        console.log(re);
        textOccurence += (service.serviceName.match(re)||[]).length
        textOccurence += (service.details.match(re)||[]).length
        service.textOccurence = textOccurence;
        if(textOccurence <=0) continue;
      }
      let groomers = this.state.groomers.filter(g=>g.petshopDocId == service.petshopDocId);
      let reservations = this.state.reservations.filter(r=>r.petshopDocId == service.petshopDocId);

      let usedSlots = reservations.filter(item=>{
        if(item.petshopDocId == service.petshopDocId && moment(item.dateTimeStart).isSame(moment(this.state.dateTimeFilter), 'day') && moment(item.dateTimeStart).isSameOrAfter(moment()) && item.status != "cancelled"){
          try{
            groomers.find(gm=>gm.groomerDocId == item.groomerDocId).workCount++;
          }catch(e){console.error(e.message)}
  
          return true;
        }
        else return false;
      });
      console.log(usedSlots)

      let availableSlots = this.timeSlots.map((slot)=>{
        return {
          timeSlot: slot,
          // dateTimeSlot: moment(moment(this.state.dateTimeFilter).format("MM/DD/YYYY ") + slot),
          dateTimeSlot: moment(moment().format("YYYY-MM-DD")+" "+slot),
          slots: groomers.length,
          groomers: [...groomers],
        }
      })
      console.log(availableSlots)
      availableSlots = availableSlots.filter((slot, index)=>{
        let startIndex = index;
        let endIndex = index + (service.duration/30);
  
        if( endIndex < availableSlots.length){
          for(let s of usedSlots){
            if(s.status != "cancelled" && (availableSlots[startIndex].dateTimeSlot.isBetween(s.dateTimeStart, s.dateTimeEnd, null, '[]') || availableSlots[endIndex].dateTimeSlot.isBetween(s.dateTimeStart, s.dateTimeEnd, null, '[]'))){
              let groomerIndex = slot.groomers.findIndex(sg=>sg.groomerDocId == s.groomerDocId);
              if(groomerIndex != -1){ 
                slot.groomers.splice(groomerIndex, 1);
              }
            }
          }
          if(slot.groomers.length){
            return true;
          } 
          else return false;
        }
        else return false;
      })
      console.log(availableSlots)
      availableSlots = availableSlots.filter((slot, index)=>slot.dateTimeSlot.isSameOrAfter(moment()));
      console.log(availableSlots)
      service.availableSlots = availableSlots;
      service.usedSlots = usedSlots;

      filteredServices.push(service);
    }
    filteredServices.sort((a,b)=>b.distance - a.distance);
    filteredServices.sort((a,b)=>b.textOccurence - a.textOccurence);
    this.setState({filteredServices})
  }
  async loadData(){
    try{
      let groomerRecords = await firebase.firestore().collection("users").where("type", "==", "groomer").get();
      let reservationRecords = await firebase.firestore().collection("reservations").get();
      await this.loadGroomers(groomerRecords);
      await this.loadReservations(reservationRecords);
      this.serviceListener = firebase.firestore().collection("services").onSnapshot(async (records)=>{
        this.loadServices(records);
      })
      this.reservationListener = firebase.firestore().collection("reservations").onSnapshot(async (records)=>{
        this.loadReservations(records);
      })
      this.groomerListener = firebase.firestore().collection("users").where("type", "==", "groomer").onSnapshot(async (records)=>{
        this.loadGroomers(records);
      })
    }
    catch(e){console.error(e)}
  }
  async loadReservations(){
    this.reservationListener();
    this.reservationListener = firebase.firestore().collection("reservations")
    .onSnapshot(records=>{
      if(records.docs.length){
        let reservations = [];
        for(let doc of records.docs){
          let data = doc.data();
          let id = doc.id;
          reservations.push({
            reservationDocId: id,
            ...data,
            dateTimeStart: moment(data.dateTimeStart),
            dateTimeEnd: moment(data.dateTimeEnd),
            dateTime: moment(data.dateTime),
          });
        }
        reservations.sort(function(a,b){
          return b.dateTimeStart.toDate() - a.dateTimeStart.toDate();
        });
        this.setState({
          reservations
        });
      }
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <FlatList
          style={styles.list}
          data={ this.state.filteredServices }
          renderItem={({item, index}) => 
          
          <TouchableNativeFeedback 
            onPress={()=>{
              this.props.navigation.navigate('ServiceDetail', {service: item});
            }}
            background={TouchableNativeFeedback.SelectableBackground()}
          >
            <View style={{backgroundColor: "white", marginBottom: 4}}>

              <View  style={styles.itemContainer}>
                <View style={{flex: 1}}>
                  <View style={{flex: 1}}>
                    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                      {item.serviceName}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={{ color: "#00e676", fontSize: 12, fontWeight: "300"}}>
                      P{item.minPrice} - P{item.maxPrice}
                    </Text>
                  </View>
                  <View style={{flex: 1, right: 0}}>
                    <Text style={{ fontSize: 12, fontWeight: "300"}}>
                      {
                        (item.availableSlots.length)
                        ?`available at ${item.availableSlots[0].timeSlot}`
                        :`check the service for schedules`
                      }
                    </Text>
                    {/* <Text style={{ fontSize: 12, fontWeight: "300"}}>
                      {(()=>{
                        let time = "";
                        if(item.duration >= 60){
                          time += Math.floor(item.duration / 60) + " hour ";
                          if((item.duration % 60) > 0) time += item.duration % 60 + " minutes"
                        }
                        else time += item.duration + " minutes";
                        return time;
                      })()}
                    </Text> */}
                  </View>
                </View>
                <View style={{flex: 1, alignItems: "center"}}>
                  <Text style={{fontWeight: "bold"}}> {item.petshopName} </Text>
                  <Text>Petshop</Text>
                  <Text> {Math.round( (item.distance/1000) * 10 ) / 10}km away</Text>
                </View>
              </View>
              <View style={{flexDirection: "row"}}>
                <View style={{flex: 1,height: 4, backgroundColor: "#5eb8ff"}} />
                <View style={{flex: 1,height: 4, backgroundColor: "#0288d1"}} />
              </View>
            </View>
          </TouchableNativeFeedback>
        }/>
        <FilterContainer pose={ (this.state.isFilterOpen)? "open": "close" } style={styles.filterContainer}>
          <View style={styles.textInput}> 
            <TextInput
              keyboardType="number-pad"
              onChangeText={(text) => this.onFilterChange({priceFilter:text})}
              value={this.state.priceFilter}
              placeholder="Price"
            />
          </View>
          <View style={styles.textInput}> 
            <TextInput
              onChangeText={(text) => this.onFilterChange({serviceFilter:text})}
              value={this.state.serviceFilter}
              placeholder="Service"
            />
          </View>
          <View style={styles.textInput}>
            <Picker
              selectedValue={this.state.petshopFilter}
              style={{height: 50, width: 100}}
              onValueChange={(itemValue, itemIndex) =>{
                this.setState({petshopFilter: itemValue})
              }}>

              <Picker.Item label="All Petshop" value={""} />
              {this.state.petshops.map((item, index)=>
                <Picker.Item key={item.petshopDocId + moment().toDate()} label={`${item.shopName}`} value={item.petshopDocId} />
              )}
            </Picker>
          </View>
        </FilterContainer>
        <TouchableNativeFeedback 
          style={styles.filterToggle}
          onPress={()=>{
            console.log("clicked filter!");
            this.setState({ isFilterOpen: !this.state.isFilterOpen })
          }}
          background={TouchableNativeFeedback.SelectableBackground()}
          >
          <FilterToggle style={styles.filterToggle} pose={ (this.state.isFilterOpen)? "open": "close" }>
            <Text style={{color: "white"}}>Filter</Text>
          </FilterToggle>
        </TouchableNativeFeedback >
        
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: "hidden",
  },
  filterContainer:{
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    backgroundColor: "#5eb8ff",
    elevation: 2,
    overflow: "visible",
    elevation: 20,
  },
  filterToggle:{
    height: 25,
    position: "absolute",
    bottom: 200,
    right: 0,
    left: 0,
    marginHorizontal: 50,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#0288d1",
    borderTopColor: "gray",
    borderLeftColor: "gray",
    borderRightColor: "gray",
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 20,
    zIndex: 1000,
  },
  list: {
    backgroundColor: "#eeeeee",
  },
  itemContainer: {
    paddingHorizontal: 20,
    flexDirection: "row"
  },
  textInput: {
    flexDirection: "row",
    borderColor:'grey',
    width:250,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize:15,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    
  },
});
