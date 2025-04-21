const httpStatus = require("http-status");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const imagePath = require("../config/image-path");
const { Features, ModelType, FeaturesArrayForFaq, SafetyArrayForFaq, FeaturesDisplayName, FAQsFeatures } = require("../config/constant");

const faq = async (brand, model, variant, cityId) => {

  const brandModelDetailsGet = db("cop_models")
    .select(
      db.raw(`CONCAT(cop_brands_ms.brand_name,' ',cop_models.model_name) as name`),
      db.raw(`CONCAT(cop_brands_ms.brand_name,' ',cop_models.model_name,' ',cop_variants.variant_name) as variant_name`),
      "cop_models.model_type",
      db.raw(
        `CONCAT(?, cop_brands_ms.brand_id, '/', cop_models.model_id,'/' ,cop_variants.variant_id ,'/',cop_variants.variant_image) as variant_image`,
        [imagePath.brand]
      )
    )
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .innerJoin("cop_variants", "cop_variants.model_id", "cop_models.model_id")
    .where("cop_models.slug", model)
    .where("cop_variants.slug", variant)
    .first();

  const faqOtherDetailsGet = db("cop_fv")
    .select(
      db.raw(
        `GROUP_CONCAT(
                JSON_OBJECT(
                    'feature_value', CONCAT(cop_fv.feature_value, ' ', IFNULL(cop_su_ms.su_name, '')),
                    'feature_name', cop_features_ms.features_name
                )
          ) AS feature_json`
      )
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .leftJoin("cop_su_ms", "cop_su_ms.su_id", "cop_features_ms.su_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", FAQsFeatures)
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const featureValueGet = db("cop_fv")
    .select(
      db.raw("GROUP_CONCAT(cop_features_ms.features_name) as features")
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", FeaturesArrayForFaq)
    .andWhere("cop_fv.feature_value", "=", "Yes")
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const safetyValueGet = db("cop_fv")
    .select(
      db.raw("GROUP_CONCAT(cop_features_ms.features_name) as safety")
    )
    .innerJoin("cop_features_ms", "cop_features_ms.feature_id", "cop_fv.feature_id")
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_fv.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .innerJoin("cop_brands_ms", "cop_brands_ms.brand_id", "cop_models.brand_id")
    .whereIn("cop_features_ms.features_name", SafetyArrayForFaq)
    .andWhere("cop_fv.feature_value", "!=", "No")
    .andWhere("cop_models.slug", model)
    .andWhere("cop_variants.slug", variant)
    .andWhere("cop_brands_ms.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_variants.status", 1)
    .first();

  const exShowroomPriceGet = db("cop_pe_ms")
    .select(
      db.raw(`MIN(cop_pe_ms.ex_showroom_price) AS ex_showroom_price`)
    )
    .innerJoin("cop_variants", "cop_variants.variant_id", "cop_pe_ms.variant_id")
    .innerJoin("cop_models", "cop_models.model_id", "cop_variants.model_id")
    .where("cop_models.slug", model)
    .andWhere("cop_pe_ms.city_id", cityId)
    .andWhere("cop_variants.status", 1)
    .andWhere("cop_models.status", 1)
    .andWhere("cop_pe_ms.status", 1)
    .first();

  try {
    const brandModelDetails = await brandModelDetailsGet;
    const faqOtherDetailsData = await faqOtherDetailsGet;
    const featureActiveData = await featureValueGet;
    const safetyActiveData = await safetyValueGet;
    const exShowroomPrice = await exShowroomPriceGet;

    const mapDisplayNames = (data) => {
      const key = Object.keys(data)[0];
      const featureValues = data[key];

      if (featureValues) {
        return {
          [key]: featureValues
            .split(",")
            .map((feature) => FeaturesDisplayName[feature.trim()] || feature.trim())
            .join(", "),
        };
      } else {
        return { [key]: null };
      }
    };
    const featureMap = (feature) => faqOtherDetails.find((item) => item.feature_name === feature)?.feature_value;

    const brandModelName = brandModelDetails.name;
    const faqOtherDetails = faqOtherDetailsData.feature_json ? JSON.parse(`[${faqOtherDetailsData.feature_json}]`) : [];
    let featureActive = featureActiveData ? mapDisplayNames(featureActiveData) : [];
    let safetyActive = safetyActiveData ? mapDisplayNames(safetyActiveData) : [];

    const displacement = featureMap(Features.displacement);
    const typeOfEngine = featureMap(Features.typeOfEngine);
    const mileage = featureMap(Features.mileage);
    const airbags = featureMap(Features.noOfAirbags);
    const drivingRange = featureMap(Features.drivingRange);
    const batteryCapacity = featureMap(Features.batteryCapacity);
    const power = featureMap(Features.power);
    const evPower = featureMap(Features.evPower);
    const torque = featureMap(Features.torque);
    const groundClearance = featureMap(Features.groundClearance);
    const bootSpace = featureMap(Features.bootSpace);
    const fuelTankCapacity = featureMap(Features.fuelTankCapacity);
    const batteryType = featureMap(Features.batteryType);
    const sunroof = featureMap(Features.sunroof);
    const moonroof = featureMap(Features.moonroof);
    const climateControl = featureMap(Features.climateControl);
    const rearCamera = featureMap(Features.rearCamera);
    const rainSensingWipers = featureMap(Features.rainSensingWipers);
    const voiceCommands = featureMap(Features.voiceCommands);
    const cruiseControl = featureMap(Features.cruiseControl);
    const antiLockBrakingSystem = featureMap(Features.antiLockBrakingSystem);
    const blindSpotMonitoring = featureMap(Features.blindSpotMonitoring);
    const speedSensingAutoDoorLock = featureMap(Features.speedSensingAutoDoorLock);
    const hillDescentControl = featureMap(Features.hillDescentControl);
    const crashSensor = featureMap(Features.crashSensor);
    const tyrePressureMonitor = featureMap(Features.tyrePressureMonitor);
    const parkingSensors = featureMap(Features.parkingSensors);
    const highSpeedAlert = featureMap(Features.highSpeedAlert);
    const parkAssist = featureMap(Features.parkAssist);
    const hillAssist = featureMap(Features.hillAssist);
    const brakeAssist = featureMap(Features.brakeAssist);
    const sosAssistance = featureMap(Features.sosAssistance);
    const threeSixtyCamera = featureMap(Features.threeSixtyCamera);
    const laneWatchCamera = featureMap(Features.laneWatchCamera);
    const laneChangeIndicator = featureMap(Features.laneChangeIndicator);
    const appleCarPlay = featureMap(Features.appleCarPlay);
    const androidAuto = featureMap(Features.androidAuto);
    const wirelessPhoneCharger = featureMap(Features.wirelessPhoneCharger);
    const bluetoothConnectivity = featureMap(Features.bluetoothConnectivity);
    const topSpeed = featureMap(Features.topSpeed);
    const zeroToHundredKm = featureMap(Features.zeroToHundredKm);

    const data = [];
    const faqs = [];
    const specification = [];
    const feature = [];
    const safety = [];
    const performance = [];
    const price = [];
    const other = [];

    // specification
    if ((displacement || typeOfEngine) && brandModelDetails.model_type == ModelType.nonEv) {
      if (displacement && typeOfEngine) {
        specification.push({
          qus: `What are the engine type and capacity for ${brandModelName}?`,
          ans: `The ${brandModelName} features a <strong>${displacement.trim()}</strong> engine with <strong>${typeOfEngine.trim()}</strong>, offering powerful and efficient performance.`
        });
      } else if (displacement && !typeOfEngine) {
        specification.push({
          qus: `What is the engine capacity of ${brandModelName}?`,
          ans: `The ${brandModelName} features a <strong>${displacement.trim()}</strong> engine, offering powerful and efficient performance.`
        });
      } else if (!displacement && typeOfEngine) {
        specification.push({
          qus: `What is the engine type of ${brandModelName}?`,
          ans: `The ${brandModelName} features a <strong>${typeOfEngine.trim()}</strong> engine, offering powerful and efficient performance.`
        });
      }
    }
    if (batteryType && brandModelDetails.model_type == ModelType.ev) {
      specification.push({
        qus: `What type of battery does the ${brandModelName} use?`,
        ans: `The ${brandModelName} features a <strong>${batteryType.trim()}${batteryType.trim().toLowerCase().includes("battery") ? '' : ' battery'}</strong>, offering powerful and efficient performance.`
      });
    }

    if (power || evPower || torque) {
      let powerValue = "";
      if (power && brandModelDetails.model_type == ModelType.nonEv) {
        powerValue = power;
      } else if (evPower && brandModelDetails.model_type == ModelType.ev) {
        powerValue = evPower;
      }
      if (powerValue && torque) {
        specification.push({
          qus: `What are the horsepower and torque of the ${brandModelName}?`,
          ans: `It boasts <strong>${powerValue.trim()}</strong> horsepower and about <strong>${torque.trim()}</strong> torque.`
        });
      } else if (powerValue && !torque) {
        specification.push({
          qus: `What is the horsepower of the ${brandModelName}?`,
          ans: `It boasts <strong>${powerValue.trim()}</strong> horsepower.`
        });
      } else if (!powerValue && torque) {
        specification.push({
          qus: `What is the torque of the ${brandModelName}?`,
          ans: `It boasts <strong>${torque.trim()}</strong> torque.`
        });
      }
    }

    if (groundClearance) {
      specification.push({
        qus: `What is the ${brandModelName}'s ground clearance?`,
        ans: `The ${brandModelName} provides a ground clearance of <strong>${groundClearance.trim()}</strong> that is suitable for different terrains.`
      });
    }

    if (bootSpace) {
      specification.push({
        qus: `What is the ${brandModelName}'s boot space?`,
        ans: `The ${brandModelName} presents <strong>${bootSpace.trim()}</strong> of spacious boot space.`
      });
    }

    if (fuelTankCapacity && brandModelDetails.model_type == ModelType.nonEv) {
      specification.push({
        qus: `What is the ${brandModelName}'s fuel tank capacity?`,
        ans: `The fuel tank capacity of <strong>${fuelTankCapacity.trim()}</strong> is what guarantees minimal stops on long trips for the ${brandModelName}.`
      });
    }
    if (batteryCapacity && brandModelDetails.model_type == ModelType.ev) {
      specification.push({
        qus: `What is the battery capacity of ${brandModelName}?`,
        ans: `The ${brandModelName} features a <strong>${batteryCapacity.trim()}</strong> battery capacity, offering powerful and efficient performance.`
      });
    }

    // feature
    if (featureActive.features) {
      const features = featureActive.features.split(',').map(feature => feature.trim());
      const mainFeature = features[0];
      const additionalFeaturesArray = features.slice(1);
      const additionalFeatures = additionalFeaturesArray.join(", ");

      feature.push({
        qus: `What are the key features of the ${brandModelName}?`,
        ans: `The ${brandModelName} is equipped with <strong>${mainFeature.trim()}</strong>. Additionally, it has lavish facilities like <strong>${additionalFeatures.trim()}</strong>.`
      });
    }

    if (sunroof && moonroof) {
      if (sunroof.trim().toLowerCase().includes("yes") && moonroof.trim().toLowerCase().includes("yes")) {
        feature.push({
          qus: `Is there a sunroof/moonroof available in the ${brandModelName}?`,
          ans: `Yes, the ${brandModelName}  is available with an optional panoramic sunroof/moonroof.`
        });
      } else if (sunroof.trim().toLowerCase().includes("yes") && moonroof.trim().toLowerCase().includes("no")) {
        feature.push({
          qus: `Is there a sunroof/moonroof available in the ${brandModelName}?`,
          ans: `Yes, the ${brandModelName}  is available with an optional panoramic sunroof.`
        });
      } else if (sunroof.trim().toLowerCase().includes("no") && moonroof.trim().toLowerCase().includes("yes")) {
        feature.push({
          qus: `Is there a sunroof/moonroof available in the ${brandModelName}?`,
          ans: `Yes, the ${brandModelName}  is available with an optional panoramic moonroof.`
        });
      } else {
        feature.push({
          qus: `Is there a sunroof/moonroof available in the ${brandModelName}?`,
          ans: `No, sunroof/moonroof feature not available in the ${brandModelName}.`
        });
      }
    }

    if (climateControl) {
      feature.push({
        qus: `Is a climate system included in the ${brandModelName}?`,
        ans: `${climateControl.trim().toLowerCase().includes("no") ? 'No, climate control feature not available.' : 'For optimal comfort, ' + brandModelName + ' is equipped with Automatic Climate Control.'}`
      });
    }

    if (rearCamera) {
      feature.push({
        qus: `Does the ${brandModelName} have a rearview camera?`,
        ans: `${rearCamera.trim().toLowerCase().includes("no") ? 'No, rear view camera feature not available.' : 'Yes, to enhance easy parking and reversing, the ' + brandModelName + ' is fitted with a high-definition rearview camera.'}`
      });
    }

    let activeFeatures = [];
    if (!rainSensingWipers.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.rainSensingWipers) }
    if (!voiceCommands.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.voiceCommands) }
    if (!cruiseControl.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.cruiseControl) }
    if (!antiLockBrakingSystem.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.antiLockBrakingSystem) }
    if (!blindSpotMonitoring.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.blindSpotMonitoring) }
    if (!speedSensingAutoDoorLock.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.speedSensingAutoDoorLock) }
    if (!hillDescentControl.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.hillDescentControl) }
    if (!crashSensor.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.crashSensor) }
    if (!tyrePressureMonitor.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.tyrePressureMonitor) }
    if (!parkingSensors.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.parkingSensors) }
    if (!highSpeedAlert.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.highSpeedAlert) }
    if (!parkAssist.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.parkAssist) }
    if (!hillAssist.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.hillAssist) }
    if (!brakeAssist.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.brakeAssist) }
    if (!sosAssistance.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.sosAssistance) }
    if (!threeSixtyCamera.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.threeSixtyCamera) }
    if (!laneWatchCamera.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.laneWatchCamera) }
    if (!laneChangeIndicator.trim().toLowerCase().includes("no")) { activeFeatures.push(Features.laneChangeIndicator) }
    if (activeFeatures.length > 0) {
      feature.push({
        qus: `Which driver assistance features come with the ${brandModelName} model?`,
        ans: `The ${brandModelName} offers driver assistance features such as ${activeFeatures.join(", ")}`
      });
    }

    if (appleCarPlay && androidAuto) {
      if (!appleCarPlay.trim().toLowerCase().includes("no") && !androidAuto.trim().toLowerCase().includes("no")) {
        feature.push({
          qus: `Does the ${brandModelName} support Apple CarPlay and Android Auto?`,
          ans: `Yes, the ${brandModelName} effortlessly synchronises with Apple CarPlay and Android Auto both meant for smartphones.`
        });
      } else if (!appleCarPlay.trim().toLowerCase().includes("no") && androidAuto.trim().toLowerCase().includes("no")) {
        feature.push({
          qus: `Does the ${brandModelName} support Apple CarPlay and Android Auto?`,
          ans: `Yes, the ${brandModelName} effortlessly synchronises with Apple CarPlay but does not support Android Auto.`
        });
      } else if (appleCarPlay.trim().toLowerCase().includes("no") && !androidAuto.trim().toLowerCase().includes("no")) {
        feature.push({
          qus: `Does the ${brandModelName} support Apple CarPlay and Android Auto?`,
          ans: `Yes, the ${brandModelName} effortlessly synchronises with Android Auto but does not support Apple CarPlay.`
        });
      } else {
        feature.push({
          qus: `Does the ${brandModelName} support Apple CarPlay and Android Auto?`,
          ans: `No, the ${brandModelName} not support Apple CarPlay and Android Auto.`
        });
      }
    }

    if (wirelessPhoneCharger) {
      feature.push({
        qus: `Does the ${brandModelName} support wireless charging?`,
        ans: `${wirelessPhoneCharger.trim().toLowerCase().includes("no") ? 'No, wireless charging feature not available.' : 'The ' + brandModelName + ' comes with a wireless charging pad for compatible devices.'}`
      });
    }

    if (bluetoothConnectivity) {
      feature.push({
        qus: `Does the ${brandModelName} have Bluetooth connectivity?`,
        ans: `${bluetoothConnectivity.trim().toLowerCase().includes("no") ? 'No, Bluetooth connectivity feature not available.' : 'Yes, the ' + brandModelName + ' offers Bluetooth connectivity for hands-free calls and audio streaming.'}`
      });
    }

    // safety
    if (safetyActive.safety) {
      if (airbags) {
        safetyActive.safety = safetyActive.safety.replace("Airbags", airbags.trim() + " Airbags");
      }
      safety.push({
        qus: `What are ${brandModelName}’s safety features?`,
        ans: `The car has safety features that includes <strong>${safetyActive.safety}</strong>.`
      });
    }

    if (airbags && !airbags.trim().toLowerCase().includes("no")) {
      safety.push({
        qus: `How many airbags does the ${brandModelName} have?`,
        ans: `The ${brandModelName} is equipped with up to <strong>${airbags.trim()}</strong> airbags.`
      });
    }

    if (antiLockBrakingSystem) {
      safety.push({
        qus: `Does the ${brandModelName} have an anti-lock braking system (ABS)?`,
        ans: `${antiLockBrakingSystem.trim().toLowerCase().includes("no") ? `No, anti-lock braking system (ABS) feature not available.` : `Yes, the ${brandModelName} has a reliable anti-lock braking system (ABS) for enhanced safety.`}`
      });
    }

    // performance
    if (mileage && brandModelDetails.model_type == ModelType.nonEv) {
      performance.push({
        qus: `What is the fuel efficiency of the ${brandModelName}?`,
        ans: `The ${brandModelName} is one that is known for its fuel efficiency, which is <strong>${mileage.trim()}</strong>.`
      });
    }
    // if (drivingRange && brandModelDetails.model_type == ModelType.ev) {
    //   faqs.push({
    //     qus: `What is the driving range of ${brandModelName}?`,
    //     ans: `The ${brandModelName} is one that known for its driving range, which is <strong>${drivingRange}</strong>.`
    //   });
    // }

    if (topSpeed) {
      performance.push({
        qus: `What is the ${brandModelName}’s top speed?`,
        ans: `The top speed of the ${brandModelName} is <strong>${topSpeed.trim()}</strong>.`
      });
    }

    if (zeroToHundredKm) {
      performance.push({
        qus: `How fast can the ${brandModelName} accelerate from 0-100 km/h?`,
        ans: `The ${brandModelName} can accelerate from zero up 100 km/h in <strong>${zeroToHundredKm.trim()}</strong>.`
      });
    }

    if (batteryCapacity && brandModelDetails.model_type == ModelType.ev) {
      const batteryCapacityFlot = parseFloat(batteryCapacity.split(' ')[0]);

      const similarEvCarsGet = db('cop_models')
        .select(
          db.raw(`CONCAT(cop_brands_ms.brand_name,' ',cop_models.model_name) as similar_model`),
          db.raw(`CONCAT(cop_brands_ms.slug,'-cars/',cop_models.slug) as model_slug`)
        )
        .innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_models.brand_id')
        .innerJoin('cop_variants', 'cop_variants.model_id', 'cop_models.model_id')
        .innerJoin('cop_fv', 'cop_fv.variant_id', 'cop_variants.variant_id')
        .innerJoin('cop_features_ms', 'cop_features_ms.feature_id', 'cop_fv.feature_id')
        .where('cop_features_ms.features_name', Features.batteryCapacity)
        .andWhere('cop_models.slug', '!=', model)
        .andWhere('cop_variants.status', 1)
        .andWhere('cop_models.status', 1)
        .andWhere('cop_brands_ms.status', 1)
        .andWhereBetween(
          db.raw("CAST(SUBSTRING_INDEX(cop_fv.feature_value,' ',1) AS FLOAT)"),
          [batteryCapacityFlot - 20, batteryCapacityFlot + 20]
        )
        .distinct()
        .limit(5);

      const similarEvCars = await similarEvCarsGet;

      const similarModels = [];
      similarEvCars.forEach((item) => {
        similarModels.push(`<a href='${item.model_slug}' >${item.similar_model}</a>`);
      });

      if (similarModels.length > 0) {
        performance.push({
          qus: `How does the ${brandModelName} compare to the other models in terms of performance?`,
          ans: `The ${brandModelName} impresses with strong performance, thanks to its powerful engine selection and robust handling. Other notable vehicles, such as the <strong>${similarModels.join(", ")}</strong>.`
        });
      }
    }
    if (displacement && brandModelDetails.model_type == ModelType.nonEv) {
      const displacementInt = parseInt(displacement.split(' ')[0]);

      const similarNonEvCarsGet = db('cop_models')
        .select(
          db.raw(`CONCAT(cop_brands_ms.brand_name,' ',cop_models.model_name) as similar_model`),
          db.raw(`CONCAT(cop_brands_ms.slug,'-cars/',cop_models.slug) as model_slug`)
        )
        .innerJoin('cop_brands_ms', 'cop_brands_ms.brand_id', 'cop_models.brand_id')
        .innerJoin('cop_variants', 'cop_variants.model_id', 'cop_models.model_id')
        .innerJoin('cop_fv', 'cop_fv.variant_id', 'cop_variants.variant_id')
        .innerJoin('cop_features_ms', 'cop_features_ms.feature_id', 'cop_fv.feature_id')
        .where('cop_features_ms.features_name', Features.displacement)
        .andWhere('cop_models.slug', '!=', model)
        .andWhere('cop_variants.status', 1)
        .andWhere('cop_models.status', 1)
        .andWhere('cop_brands_ms.status', 1)
        .andWhereBetween(
          db.raw("CAST(SUBSTRING_INDEX(cop_fv.feature_value,' ',1) AS SIGNED)"),
          [displacementInt - 500, displacementInt + 500]
        )
        .distinct()
        .limit(5);

      const similarNonEvCars = await similarNonEvCarsGet;

      const similarModels = [];
      similarNonEvCars.forEach((item) => {
        similarModels.push(`<a href='${item.model_slug}' >${item.similar_model}</a>`);
      });

      if (similarModels.length > 0) {
        performance.push({
          qus: `How does the ${brandModelName} compare to the other models in terms of performance?`,
          ans: `The ${brandModelName} impresses with strong performance, thanks to its powerful engine selection and robust handling. Other notable vehicles, such as the <strong>${similarModels.join(", ")}</strong>.`
        });
      }
    }

    // price
    if (exShowroomPrice.ex_showroom_price) {
      price.push({
        qus: `How much is the starting price for ${brandModelName}?`,
        ans: `Its starting price is set at a competitive INR <strong>${exShowroomPrice.ex_showroom_price}</strong>.`
      });
    }

    // other
    other.push({
      qus: `What are the ${brandModelName} recommended service intervals?`,
      ans: `the ${brandModelName} are every <strong>10,000 km</strong> or <strong>6 months</strong>, whichever comes first.`
    }, {
      qus: `Are spare parts readily available for the ${brandModelName}?`,
      ans: `Yes, Spare parts for the ${brandModelName} are readily available at authorised dealerships and service centres.`
    });

    specification.length > 0 && faqs.push({ type: "Specification", value: specification });
    feature.length > 0 && faqs.push({ type: "Feature", value: feature });
    safety.length > 0 && faqs.push({ type: "Safety", value: safety });
    performance.length > 0 && faqs.push({ type: "Performance", value: performance });
    price.length > 0 && faqs.push({ type: "Price", value: price });
    other.length > 0 && faqs.push({ type: "Other", value: other });
    
    const result = {
      variant_name: brandModelDetails.variant_name,
      variant_image: brandModelDetails.variant_image,
      faqs
    };

    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};

module.exports = {
  faq,
};
