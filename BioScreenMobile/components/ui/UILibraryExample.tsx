/**
 * Example component demonstrating React Native UI Library usage
 * with your existing color scheme and typography
 * 
 * This is a reference implementation showing various UI Library features.
 * You can use this as a template or delete it after reviewing.
 */

import React from 'react';
import { ScrollView } from 'react-native';

export function UILibraryExample() {
  // Import UI Library components dynamically
  const { View, Text, Button, Card, TextField, Colors } = require('react-native-ui-lib');
  
  const [inputValue, setInputValue] = React.useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View padding-s5>
        {/* Typography Examples */}
        <View marginB-s6>
          <Text h1 color="text" marginB-s2>
            Typography Examples
          </Text>
          <Text h3 color="primary" marginB-s3>
            This uses your primary color
          </Text>
          <Text body color="textSecondary" marginB-s2>
            Body text with secondary color
          </Text>
          <Text bodySmall color="text">
            Small body text
          </Text>
        </View>

        {/* Button Examples */}
        <View marginB-s6>
          <Text h2 color="text" marginB-s3>
            Buttons
          </Text>
          <Button
            label="Primary Button"
            backgroundColor={Colors.primary}
            marginB-s3
            onPress={() => console.log('Primary pressed')}
          />
          <Button
            label="Secondary Button"
            backgroundColor={Colors.secondary}
            marginB-s3
            onPress={() => console.log('Secondary pressed')}
          />
          <Button
            label="Outline Button"
            outline
            outlineColor={Colors.primary}
            color={Colors.primary}
            marginB-s3
            onPress={() => console.log('Outline pressed')}
          />
        </View>

        {/* Card Examples */}
        <View marginB-s6>
          <Text h2 color="text" marginB-s3>
            Cards
          </Text>
          <Card
            backgroundColor={Colors.card}
            padding-s4
            marginB-s3
            enableShadow
          >
            <Text h4 color="text" marginB-s2>
              Card Title
            </Text>
            <Text body color="textSecondary">
              This card uses your custom card background color and maintains
              the color scheme.
            </Text>
          </Card>

          <Card
            backgroundColor={Colors.surface}
            padding-s4
            marginB-s3
          >
            <View row spread centerV>
              <View>
                <Text h5 color="text">
                  Surface Card
                </Text>
                <Text caption color="textSecondary">
                  With different background
                </Text>
              </View>
              <Button
                size="small"
                label="Action"
                backgroundColor={Colors.primary}
              />
            </View>
          </Card>
        </View>

        {/* Input Examples */}
        <View marginB-s6>
          <Text h2 color="text" marginB-s3>
            Input Fields
          </Text>
          <TextField
            placeholder="Enter your name"
            floatingPlaceholder
            value={inputValue}
            onChangeText={setInputValue}
            color={Colors.text}
            placeholderTextColor={Colors.textSecondary}
            floatingPlaceholderColor={Colors.primary}
            containerStyle={{ marginBottom: 16 }}
            fieldStyle={{
              borderBottomWidth: 1,
              borderBottomColor: Colors.primary,
              paddingBottom: 8,
            }}
          />
        </View>

        {/* Color Palette Display */}
        <View marginB-s6>
          <Text h2 color="text" marginB-s3>
            Color Palette
          </Text>
          <View row>
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: Colors.primary,
                marginRight: 8,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: Colors.primary60,
                marginRight: 8,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: Colors.primary50,
                marginRight: 8,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: Colors.primary40,
                marginRight: 8,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: Colors.primary30,
                borderRadius: 8,
              }}
            />
          </View>
          <Text caption color="textSecondary" marginT-s2>
            Primary color shades
          </Text>
        </View>

        {/* Spacing Examples */}
        <View marginB-s6>
          <Text h2 color="text" marginB-s3>
            Spacing System
          </Text>
          <View backgroundColor={Colors.card} padding-s2 marginB-s2>
            <Text caption color="text">
              padding-s2 (8px)
            </Text>
          </View>
          <View backgroundColor={Colors.card} padding-s4 marginB-s2>
            <Text caption color="text">
              padding-s4 (16px)
            </Text>
          </View>
          <View backgroundColor={Colors.card} padding-s6>
            <Text caption color="text">
              padding-s6 (24px)
            </Text>
          </View>
        </View>

        {/* Status Colors */}
        <View marginB-s8>
          <Text h2 color="text" marginB-s3>
            Status Colors
          </Text>
          <View row spread>
            <View center style={{ flex: 1 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: Colors.success,
                  borderRadius: 25,
                  marginBottom: 8,
                }}
              />
              <Text caption color="text">
                Success
              </Text>
            </View>
            <View center style={{ flex: 1 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: Colors.error,
                  borderRadius: 25,
                  marginBottom: 8,
                }}
              />
              <Text caption color="text">
                Error
              </Text>
            </View>
            <View center style={{ flex: 1 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: Colors.warning,
                  borderRadius: 25,
                  marginBottom: 8,
                }}
              />
              <Text caption color="text">
                Warning
              </Text>
            </View>
            <View center style={{ flex: 1 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: Colors.info,
                  borderRadius: 25,
                  marginBottom: 8,
                }}
              />
              <Text caption color="text">
                Info
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
